package app.api.usecases

import javax.inject._
import app.models.state.WebGameState
import app.api.context.IGameContextRepository
import app.mapping.ViewStateMapper
import de.htwg.se.soccercardclash.model.playerComponent.IPlayer
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import de.htwg.se.soccercardclash.model.playerComponent.playerAction.PlayerActionPolicies
import de.htwg.se.soccercardclash.model.gameComponent.action.manager.IPlayerActionManager
import app.api.usecases.IGameUseCases
import app.models.*
import app.models.AppError
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder
import de.htwg.se.soccercardclash.controller.IController
import de.htwg.se.soccercardclash.util.AIAction
import app.session.GameSessionId
import scala.util.{Try, Success, Failure}
import app.mapping.IViewStateMapper

@Singleton
final class GameUseCases @Inject()(
  controller: IController,
  repo: IGameContextRepository,
  actionMgr: IPlayerActionManager,
  val holder: IGameContextHolder,
  viewStateMapper: IViewStateMapper
) extends IGameUseCases {

  private def noGame(sessionId: GameSessionId): Left[AppError, Nothing] = {
    val ks = try repo.keys.map(_.value).mkString(", ") catch
      case _: Throwable => "<unavailable>"
    println(s"[GameUseCases] No active game for sessionId='${sessionId.value}'. Repo keys: [$ks]")
    Left(AppError(s"No active game for sessionId: '${sessionId.value}'"))
  }

  private def withCtx[A](sessionId: GameSessionId)(f: GameContext => Either[AppError, A]): Either[AppError, A] =
    repo.get(sessionId).map(f).getOrElse(noGame(sessionId))

  private def getFromHolder: Either[AppError, GameContext] =
    Try(holder.get) match {
      case Success(ctx) => Right(ctx)
      case Failure(_)   => Left(AppError("Controller did not provide a GameContext"))
    }

  private def render(ctx: GameContext): Either[AppError, WebGameState] =
    Right(viewStateMapper.toWebState(ctx))

  private def saveAndRender(sessionId: GameSessionId, ctx: GameContext): Either[AppError, WebGameState] = {
    repo.set(sessionId, ctx)
    render(ctx)
  }

  override def createGame(p1: String, p2: String, sessionId: GameSessionId): Either[AppError, WebGameState] = {
    controller.createGame(p1, p2)
    for {
      ctx <- getFromHolder
      res <- saveAndRender(sessionId, ctx)
    } yield res
  }

  override def createGameWithAI(humanPlayer: String, aiName: String, sessionId: GameSessionId): Either[AppError, WebGameState] = {
    controller.createGameWithAI(humanPlayer, aiName)
    for {
      ctx <- getFromHolder
      res <- saveAndRender(sessionId, ctx)
    } yield res
  }

  override def load(fileName: String, sessionId: GameSessionId): Either[AppError, WebGameState] = {
    if (!controller.loadGame(fileName)) Left(AppError(s"Failed to load: $fileName"))
    else for {
      ctx <- getFromHolder
      res <- saveAndRender(sessionId, ctx)
    } yield res
  }

  override def save(sessionId: GameSessionId): Either[AppError, WebGameState] =
    withCtx(sessionId) { ctx =>
      if (controller.saveGame(ctx)) render(ctx)
      else Left(AppError("Save failed"))
    }

  override def quit(): Either[AppError, Unit] = {
    controller.quit()
    Right(())
  }

  override def state(sessionId: GameSessionId): Either[AppError, WebGameState] =
    repo.get(sessionId).map(render).getOrElse(noGame(sessionId))

  override def swap(index: Int, sessionId: GameSessionId): Either[AppError, WebGameState] =
    withCtx(sessionId) { ctx =>
      val att = ctx.state.getRoles.attacker
      if (!actionMgr.canPerform(att, PlayerActionPolicies.Swap))
        Left(AppError("No swaps remaining"))
      else {
        val (next, ok) = controller.regularSwap(index, ctx)
        if (!ok) Left(AppError("Swap not allowed")) else saveAndRender(sessionId, next)
      }
    }

  override def reverseSwap(sessionId: GameSessionId): Either[AppError, WebGameState] =
    withCtx(sessionId) { ctx =>
      val (next, ok) = controller.reverseSwap(ctx)
      if (!ok) Left(AppError("Reverse swap not allowed")) else saveAndRender(sessionId, next)
    }

  override def boost(defenderIndex: Int, sessionId: GameSessionId, goalkeeper: Boolean): Either[AppError, WebGameState] =
    withCtx(sessionId) { ctx =>
      val defn = ctx.state.getRoles.defender
      if (!actionMgr.canPerform(defn, PlayerActionPolicies.Boost))
        Left(AppError("No boosts remaining"))
      else {
        val (next, ok) =
          if (goalkeeper) controller.boostGoalkeeper(ctx)
          else            controller.boostDefender(defenderIndex, ctx)

        if (!ok) Left(AppError("Boost not allowed")) else saveAndRender(sessionId, next)
      }
    }

  override def doubleAttack(defenderIndex: Int, sessionId: GameSessionId): Either[AppError, WebGameState] =
    withCtx(sessionId) { ctx =>
      val att = ctx.state.getRoles.attacker
      if (!actionMgr.canPerform(att, PlayerActionPolicies.DoubleAttack))
        Left(AppError("No double-attacks remaining"))
      else {
        val (next, ok) = controller.doubleAttack(defenderIndex, ctx)
        if (!ok) Left(AppError("Double attack not allowed")) else saveAndRender(sessionId, next)
      }
    }

  override def singleAttack(defenderIndex: Int, sessionId: GameSessionId): Either[AppError, WebGameState] =
    withCtx(sessionId) { ctx =>
      val (next, ok) = controller.singleAttack(defenderIndex, ctx)
      if (!ok) Left(AppError("Attack not allowed")) else saveAndRender(sessionId, next)
    }

  override def undo(sessionId: GameSessionId): Either[AppError, WebGameState] =
    withCtx(sessionId) { ctx => saveAndRender(sessionId, controller.undo(ctx)) }

  override def redo(sessionId: GameSessionId): Either[AppError, WebGameState] =
    withCtx(sessionId) { ctx => saveAndRender(sessionId, controller.redo(ctx)) }

  override def executeAI(action: AIAction, sessionId: GameSessionId): Either[AppError, WebGameState] =
    withCtx(sessionId) { ctx =>
      val (next, ok) = controller.executeAIAction(action, ctx)
      if (!ok) Left(AppError("AI action not allowed")) else saveAndRender(sessionId, next)
    }
}