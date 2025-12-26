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
import app.auth.AuthPrincipal
import app.session.repositories.IGameSessionRepository

@Singleton
final class GameUseCases @Inject()(
  controller: IController,
  repo: IGameContextRepository,
  actionMgr: IPlayerActionManager,
  val holder: IGameContextHolder,
  viewStateMapper: IViewStateMapper,
  sessionRepo: IGameSessionRepository
) extends IGameUseCases {


  private def noGame(sessionId: GameSessionId): Left[AppError, Nothing] = {
    val ks = try repo.keys.map(_.value).mkString(", ") catch
      case _: Throwable => "<unavailable>"
    println(s"[GameUseCases] No active game for sessionId='${sessionId.value}'. Repo keys: [$ks]")
    Left(AppError(s"No active game for sessionId: '${sessionId.value}'"))
  }

  private def withCtx[A](sessionId: GameSessionId)(
    f: GameContext => Either[AppError, A]
  ): Either[AppError, A] =
    repo.get(sessionId).map(f).getOrElse(noGame(sessionId))

  private def getFromHolder: Either[AppError, GameContext] =
    Try(holder.get) match {
      case Success(ctx) => Right(ctx)
      case Failure(_)   => Left(AppError("Controller did not provide a GameContext"))
    }

  private def render(
    sid: GameSessionId,
    ctx: GameContext,
    principal: Option[AuthPrincipal]
  ): Either[AppError, WebGameState] =
    Right(viewStateMapper.toWebState(ctx, principal, sessionRepo.get(sid)))

  private def saveAndRender(
    sid: GameSessionId,
    ctx: GameContext,
    principal: Option[AuthPrincipal]
  ): Either[AppError, WebGameState] = {
    repo.set(sid, ctx)
    render(sid, ctx, principal)
  }


  override def createGame(
    p1: String,
    p2: String,
    sid: GameSessionId,
    principal: Option[AuthPrincipal]
  ): Either[AppError, WebGameState] = {
    controller.createGame(p1, p2)
    for {
      ctx <- getFromHolder
      res <- saveAndRender(sid, ctx, principal)
    } yield res
  }

  override def createGameWithAI(
    humanPlayer: String,
    aiName: String,
    sid: GameSessionId,
    principal: Option[AuthPrincipal]
  ): Either[AppError, WebGameState] = {
    controller.createGameWithAI(humanPlayer, aiName)
    for {
      ctx <- getFromHolder
      res <- saveAndRender(sid, ctx, principal)
    } yield res
  }

  override def load(
    fileName: String,
    sid: GameSessionId,
    principal: Option[AuthPrincipal]
  ): Either[AppError, WebGameState] = {
    if (!controller.loadGame(fileName)) Left(AppError(s"Failed to load: $fileName"))
    else for {
      ctx <- getFromHolder
      res <- saveAndRender(sid, ctx, principal)
    } yield res
  }

  override def save(
    sid: GameSessionId,
    principal: Option[AuthPrincipal]
  ): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      if (controller.saveGame(ctx)) render(sid, ctx, principal)
      else Left(AppError("Save failed"))
    }


  override def state(
    sid: GameSessionId,
    principal: Option[AuthPrincipal]
  ): Either[AppError, WebGameState] =
    repo.get(sid).map(ctx => render(sid, ctx, principal)).getOrElse(noGame(sid))


  private def norm(s: String): String = s.trim.toLowerCase

  private def requireAttackerTurn(
    sid: GameSessionId,
    ctx: GameContext,
    principal: AuthPrincipal
  ): Either[AppError, Unit] = {

    val attackerName = ctx.state.getRoles.attacker.name
    val attackerKey  = norm(attackerName)

    sessionRepo.get(sid) match {

      case Some(info) =>
        info.nameToUserId.get(attackerKey) match {
          case Some(uid) if uid == principal.userId => Right(())
          case Some(_)  => Left(AppError("Not your turn (only attacker may act)"))
          case None     =>
            Left(AppError(
              s"Cannot resolve attacker user for '$attackerName' (mapping missing). " +
              s"Known names: [${info.nameToUserId.keys.toSeq.sorted.mkString(", ")}]"
            ))
        }

      case None =>
        // ✅ simplest: local always allowed
        Right(())
        // If you insist on local identity check, use:
        // if (norm(principal.username) == attackerKey) Right(())
        // else Left(AppError("Not your turn (only attacker may act)"))
    }
  }



  override def swap(index: Int, sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      for {
        _ <- requireAttackerTurn(sid, ctx, principal)
        att = ctx.state.getRoles.attacker
        _ <- if (!actionMgr.canPerform(att, PlayerActionPolicies.Swap)) Left(AppError("No swaps remaining")) else Right(())
        (next, ok) = controller.regularSwap(index, ctx)
        res <- if (!ok) Left(AppError("Swap not allowed")) else saveAndRender(sid, next, Some(principal))
      } yield res
    }

  override def reverseSwap(sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      for {
        _ <- requireAttackerTurn(sid, ctx, principal)
        (next, ok) = controller.reverseSwap(ctx)
        res <- if (!ok) Left(AppError("Reverse swap not allowed")) else saveAndRender(sid, next, Some(principal))
      } yield res
    }

  override def boost(
    defenderIndex: Int,
    sid: GameSessionId,
    goalkeeper: Boolean,
    principal: AuthPrincipal
  ): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      for {
        _ <- requireAttackerTurn(sid, ctx, principal)

        att = ctx.state.getRoles.attacker

        _ <- if (!actionMgr.canPerform(att, PlayerActionPolicies.Boost))
              Left(AppError("No boosts remaining"))
            else Right(())

        (next, ok) =
          if (goalkeeper) controller.boostGoalkeeper(ctx)
          else            controller.boostDefender(defenderIndex, ctx)

        res <- if (!ok) Left(AppError("Boost not allowed"))
              else saveAndRender(sid, next, Some(principal))
      } yield res
    }


  override def doubleAttack(defenderIndex: Int, sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      for {
        _ <- requireAttackerTurn(sid, ctx, principal)
        att = ctx.state.getRoles.attacker
        _ <- if (!actionMgr.canPerform(att, PlayerActionPolicies.DoubleAttack)) Left(AppError("No double-attacks remaining")) else Right(())
        (next, ok) = controller.doubleAttack(defenderIndex, ctx)
        res <- if (!ok) Left(AppError("Double attack not allowed")) else saveAndRender(sid, next, Some(principal))
      } yield res
    }

  override def singleAttack(defenderIndex: Int, sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      for {
        _ <- requireAttackerTurn(sid, ctx, principal)
        (next, ok) = controller.singleAttack(defenderIndex, ctx)
        res <- if (!ok) Left(AppError("Attack not allowed")) else saveAndRender(sid, next, Some(principal))
      } yield res
    }

  override def undo(sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      for {
        _ <- requireAttackerTurn(sid, ctx, principal)
        next = controller.undo(ctx)
        res <- saveAndRender(sid, next, Some(principal))
      } yield res
    }

  override def redo(sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      for {
        _ <- requireAttackerTurn(sid, ctx, principal)
        next = controller.redo(ctx)
        res <- saveAndRender(sid, next, Some(principal))
      } yield res
    }

  override def executeAI(action: AIAction, sid: GameSessionId, principal: AuthPrincipal): Either[AppError, WebGameState] =
    withCtx(sid) { ctx =>
      for {
        _ <- requireAttackerTurn(sid, ctx, principal)
        (next, ok) = controller.executeAIAction(action, ctx)
        res <- if (!ok) Left(AppError("AI action not allowed")) else saveAndRender(sid, next, Some(principal))
      } yield res
    }

  override def quit(): Either[AppError, Unit] = {
    controller.quit()
    Right(())
  }

  override def getCtx(sid: GameSessionId): Option[GameContext] =
    repo.get(sid)

}
