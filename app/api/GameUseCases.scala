// application/services/DefaultGameUseCases.scala
package app.api

import javax.inject._
import app.models.WebGameState
import app.repositories.GameContextRepository
import app.mapping.ViewStateMapper

import de.htwg.se.soccercardclash.model.playerComponent.IPlayer

import de.htwg.se.soccercardclash.controller.IController
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import de.htwg.se.soccercardclash.model.playerComponent.playerAction.PlayerActionPolicies
import de.htwg.se.soccercardclash.model.gameComponent.action.manager.IPlayerActionManager
import app.api.IGameUseCases
import app.models.*
import app.models.AppError
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder

@Singleton
final class GameUseCases @Inject()(
  controller: IController,
  repo: GameContextRepository,
  actionMgr: IPlayerActionManager,
  holder: IGameContextHolder,
) extends IGameUseCases {

  // ---------- helpers ----------
  private def noGame: Left[AppError, Nothing] = Left(AppError("No active game"))

  private def withCtx[A](sid: String)(f: GameContext => Either[AppError, A]): Either[AppError, A] =
    repo.get(sid).map(f).getOrElse(noGame)

  private def render(ctx: GameContext): Either[AppError, WebGameState] =
    Right(ViewStateMapper.toWebState(ctx))

  private def saveAndRender(sid: String, ctx: GameContext): Either[AppError, WebGameState] = {
    repo.set(sid, ctx)
    render(ctx)
  }

  // ---------- create + read ----------
  override def createMultiplayer(p1: String, p2: String, sid: String): Either[AppError, WebGameState] = {
    val a = Option(p1).map(_.trim).getOrElse("")
    val b = Option(p2).map(_.trim).getOrElse("")
    if (a.isEmpty || b.isEmpty)
      Left(AppError("Enter both player names."))
    else if (a == b)
      Left(AppError("Player names must differ."))
    else {
      controller.createGame(a, b)
      try {
        val ctx = holder.get          // your GameContextHolder throws if missing
        saveAndRender(sid, ctx)
      } catch {
        case _: IllegalStateException =>
          Left(AppError("No active game"))
      }
    }
  }

  override def state(sid: String): Either[AppError, WebGameState] =
    repo.get(sid).map(render).getOrElse(noGame)

  // ---------- actions ----------
  override def swap(index: Int, sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      val att = ctx.state.getRoles.attacker
      if (!actionMgr.canPerform(att, PlayerActionPolicies.Swap))
        Left(AppError("No swaps remaining"))
      else {
        val (next, ok) = controller.regularSwap(index, ctx)
        if (!ok) Left(AppError("Swap not allowed"))
        else     saveAndRender(sid, next)
      }
    }

  override def boost(defenderIndex: Int, sid: String, goalkeeper: Boolean): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      val defn = ctx.state.getRoles.defender
      if (!actionMgr.canPerform(defn, PlayerActionPolicies.Boost))
        Left(AppError("No boosts remaining"))
      else {
        val (next, ok) =
          if (goalkeeper) controller.boostGoalkeeper(ctx)
          else            controller.boostDefender(defenderIndex, ctx)

        if (!ok) Left(AppError("Boost not allowed"))
        else     saveAndRender(sid, next)
      }
    }

  override def doubleAttack(defenderIndex: Int, sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      val att = ctx.state.getRoles.attacker
      if (!actionMgr.canPerform(att, PlayerActionPolicies.DoubleAttack))
        Left(AppError("No double-attacks remaining"))
      else {
        val (next, ok) = controller.doubleAttack(defenderIndex, ctx)
        if (!ok) Left(AppError("Double attack not allowed"))
        else     saveAndRender(sid, next)
      }
    }

  override def singleAttack(defenderIndex: Int, sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      val (next, ok) = controller.singleAttack(defenderIndex, ctx)
      if (!ok) Left(AppError("Attack not allowed")) else saveAndRender(sid, next)
    }

  // ---------- undo / redo ----------
  override def undo(sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx => saveAndRender(sid, controller.undo(ctx)) }

  override def redo(sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx => saveAndRender(sid, controller.redo(ctx)) }
}
