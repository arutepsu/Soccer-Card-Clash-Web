package app.controllers.session

import javax.inject.*
import play.api.mvc.*
import play.api.libs.json.*
import controllers.support.ControllerSupport
import app.session.*
import app.session.GameSessionError as GSE
import app.auth.AuthPrincipal

@Singleton
final class SessionController @Inject()(
  cc: ControllerComponents,
  service: IGameSessionService
) extends AbstractController(cc)
    with ISessionController
    with ControllerSupport
{

  private def jsonErr(msg: String) = Json.obj("error" -> msg)


  private def toHttpError(e: GameSessionError): Result =
    e match {
        case GSE.NotFound(_)        => NotFound(jsonErr("Session not found"))
        case GSE.Unauthorized(_, _) => Unauthorized(jsonErr("Unauthorized"))
        case GSE.SessionFull(_)     => Conflict(jsonErr("Session is full"))
        case GSE.AlreadyJoined(_)   => Conflict(jsonErr("Already joined"))
        case GSE.CommandFailed(m)   => BadRequest(jsonErr(m))
    }

  // GET /api/sessions
  def list: Action[AnyContent] = Action { req =>
    requirePrincipal(req) match {
      case Left(res) => res
      case Right(_)  =>
        val dtos = service
          .listSessions()
          .map { case (id, info) => SessionMapper.toDto(id, info) }

        Ok(Json.toJson(dtos))
    }
  }

  // GET /api/sessions/:id
  def get(id: String): Action[AnyContent] = Action { req =>
    requirePrincipal(req) match {
      case Left(res) => res
      case Right(_) =>
        service.getSession(GameSessionId(id)) match {
          case Left(err)   => toHttpError(err)
          case Right(info) =>
            Ok(Json.toJson(SessionMapper.toDto(GameSessionId(id), info)))
        }
    }
  }

  // POST /api/sessions
  def create: Action[JsValue] = Action(parse.json) { req =>
    requirePrincipal(req) match {
      case Left(res) => res
      case Right(principal) =>
        req.body.validate[CreateSessionRequestDto] match {
          case JsError(e) =>
            BadRequest(Json.obj("error" -> "Invalid payload", "details" -> JsError.toJson(e)))

          case JsSuccess(dto, _) =>
            val sessionName = dto.name.trim
            if (sessionName.isEmpty) BadRequest(jsonErr("Session name must not be empty"))
            else {
              val hostName = principal.username

              service.createSession(principal, hostName, sessionName) match {
                case Left(err) =>
                  toHttpError(err)

                case Right(created) =>
                  Ok(Json.toJson(
                    SessionCreatedResponseDto(
                      sessionId = created.id.value,
                      hostToken = created.hostToken.value
                    )
                  )).withSession(req.session + ("sid" -> created.id.value))
              }
            }
        }
    }
  }

  // POST /api/sessions/:id/join
  def join(id: String): Action[JsValue] = Action(parse.json) { req =>
    requirePrincipal(req) match {
      case Left(res) => res
      case Right(principal) =>
        req.body.validate[JoinSessionRequestDto] match {
          case JsError(e) =>
            BadRequest(Json.obj("error" -> "Invalid payload", "details" -> JsError.toJson(e)))

          case JsSuccess(_, _) =>
            val guestName = principal.username

            service.joinSession(principal, GameSessionId(id), guestName) match {
              case Left(err) =>
                toHttpError(err)

              case Right(joined) =>
                Ok(Json.toJson(
                  SessionJoinedResponseDto(
                    sessionId = joined.id.value,
                    playerToken = joined.guestToken.value
                  )
                )).withSession(req.session + ("sid" -> id))
            }
        }
    }
  }

  // POST /api/sessions/:id/leave
  def leave(id: String): Action[AnyContent] = Action { req =>
    requirePrincipal(req) match {
      case Left(res) => res
      case Right(principal) =>
        service.leaveSession(principal, GameSessionId(id)) match {
        case Left(GSE.CommandFailed("Session closed")) =>
            Ok(jsonErr("Session closed")).withSession(req.session - "sid")

          case Left(err) =>
            toHttpError(err)

          case Right(_) =>
            Ok(Json.obj("ok" -> true)).withSession(req.session - "sid")
        }
    }
  }
}
