package app.controllers.state

import javax.inject._
import play.api.libs.json._
import play.api.mvc._
import scala.concurrent.ExecutionContext
import play.api.Configuration

import app.controllers.support.ControllerSupport
import app.session.{GameSessionId, IGameSessionService}
import app.api.context.IGameContextRepository
import app.mapping.IViewStateMapper
import app.auth.AuthPrincipal

@Singleton
final class GameStateController @Inject()(
  cc: ControllerComponents,
  sessionService: IGameSessionService,
  ctxRepo: IGameContextRepository,
  viewStateMapper: IViewStateMapper,
  config: Configuration
)(implicit ec: ExecutionContext)
  extends AbstractController(cc)
    with ControllerSupport
    with IGameStateController {

  private val JSON_CT = "application/json"

  private def sidFromQueryOrSession(req: RequestHeader): Either[Result, GameSessionId] =
    req.getQueryString("sid").map(_.trim).filter(_.nonEmpty) match {
      case Some(raw) => Right(GameSessionId(raw))
      case None      => requireSid(req)
    }

  override def state: Action[AnyContent] = Action { implicit req =>
    given Configuration = config

    principalOrAnonymous(req) match {
      case Left(res) => res

      case Right(principal) =>
        sidFromQueryOrSession(req) match {
          case Left(res) => res.as(JSON_CT)

          case Right(sid) =>
            ctxRepo.get(sid) match {
              case None =>
                NotFound(Json.obj("error" -> s"No active game for sessionId: '${sid.value}'"))
                  .as(JSON_CT)
                  .addingToSession("sid" -> sid.value)

              case Some(ctx) =>
                val infoOpt = sessionService.getSession(sid).toOption
                val web = viewStateMapper.toWebState(ctx, Some(principal), infoOpt)

                Ok(Json.toJson(web))
                  .as(JSON_CT)
                  .addingToSession("sid" -> sid.value)
            }

        }
    }
  }
}
