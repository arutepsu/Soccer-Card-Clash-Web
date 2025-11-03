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
import de.htwg.se.soccercardclash.util.AIAction
import scala.util.{Try, Success, Failure}

@Singleton
final class GameUseCases @Inject()(
  controller: IController,
  repo: GameContextRepository,
  actionMgr: IPlayerActionManager,
  holder: IGameContextHolder,
) extends IGameUseCases {

  private def noGame: Left[AppError, Nothing] = Left(AppError("No active game"))

  private def withCtx[A](sid: String)(f: GameContext => Either[AppError, A]): Either[AppError, A] =
    repo.get(sid).map(f).getOrElse(noGame)

  private def getFromHolder: Either[AppError, GameContext] =
    Try(holder.get) match {
      case Success(ctx) => Right(ctx)
      case Failure(_)   => Left(AppError("Controller did not provide a GameContext"))
    }

  private def render(ctx: GameContext): Either[AppError, WebGameState] =
    Right(ViewStateMapper.toWebState(ctx))

  private def saveAndRender(sid: String, ctx: GameContext): Either[AppError, WebGameState] = {
    repo.set(sid, ctx)
    render(ctx)
  }


  override def createGame(p1: String, p2: String, sid: String): Either[AppError, WebGameState] = {
    controller.createGame(p1, p2)
    for {
      ctx <- getFromHolder
      res <- saveAndRender(sid, ctx)
    } yield res
  }

  override def createGameWithAI(humanPlayer: String, aiName: String, sid: String): Either[AppError, WebGameState] = {
    controller.createGameWithAI(humanPlayer, aiName)
    for {
      ctx <- getFromHolder
      res <- saveAndRender(sid, ctx)
    } yield res
  }

  override def load(fileName: String, sid: String): Either[AppError, WebGameState] = {
    if (!controller.loadGame(fileName)) Left(AppError(s"Failed to load: $fileName"))
    else for {
      ctx <- getFromHolder
      res <- saveAndRender(sid, ctx)
    } yield res
  }

  override def save(sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      if (controller.saveGame(ctx)) render(ctx)
      else Left(AppError("Save failed"))
    }

  override def quit(): Either[AppError, Unit] = {
    controller.quit()
    Right(())
  }

  override def state(sid: String): Either[AppError, WebGameState] =
    repo.get(sid).map(render).getOrElse(noGame)

  override def swap(index: Int, sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      val att = ctx.state.getRoles.attacker
      if (!actionMgr.canPerform(att, PlayerActionPolicies.Swap))
        Left(AppError("No swaps remaining"))
      else {
        val (next, ok) = controller.regularSwap(index, ctx)
        if (!ok) Left(AppError("Swap not allowed")) else saveAndRender(sid, next)
      }
    }

  override def reverseSwap(sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      val (next, ok) = controller.reverseSwap(ctx)
      if (!ok) Left(AppError("Reverse swap not allowed")) else saveAndRender(sid, next)
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

        if (!ok) Left(AppError("Boost not allowed")) else saveAndRender(sid, next)
      }
    }

  override def doubleAttack(defenderIndex: Int, sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      val att = ctx.state.getRoles.attacker
      if (!actionMgr.canPerform(att, PlayerActionPolicies.DoubleAttack))
        Left(AppError("No double-attacks remaining"))
      else {
        val (next, ok) = controller.doubleAttack(defenderIndex, ctx)
        if (!ok) Left(AppError("Double attack not allowed")) else saveAndRender(sid, next)
      }
    }

  override def singleAttack(defenderIndex: Int, sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      val (next, ok) = controller.singleAttack(defenderIndex, ctx)
      if (!ok) Left(AppError("Attack not allowed")) else saveAndRender(sid, next)
    }

  override def undo(sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx => saveAndRender(sid, controller.undo(ctx)) }

  override def redo(sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx => saveAndRender(sid, controller.redo(ctx)) }

  override def executeAI(action: AIAction, sid: String): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      val (next, ok) = controller.executeAIAction(action, ctx)
      if (!ok) Left(AppError("AI action not allowed")) else saveAndRender(sid, next)
    }
}
