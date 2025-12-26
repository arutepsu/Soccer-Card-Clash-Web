package app.controllers.session

import javax.inject.*
import play.api.Configuration
import play.api.mvc.*
import play.api.libs.json.*
import app.controllers.support.ControllerSupport
import app.session.*
import app.session.GameSessionError as GSE
import app.auth.AuthPrincipal
import app.mapping.IViewStateMapper
import app.api.eventHub.GameEventHub

// fix after real auth
@Singleton
final class SessionController @Inject()(
  cc: ControllerComponents,
  service: IGameSessionService,
  config: Configuration,
  viewStateMapper: IViewStateMapper,
  eventHub: GameEventHub
) extends AbstractController(cc)
    with ISessionController
    with ControllerSupport {

  given Configuration = config

  private def jsonErr(msg: String) = Json.obj("error" -> msg)

  private def toHttpError(e: GameSessionError): Result =
    e match {
      case GSE.NotFound(_)        => NotFound(jsonErr("Session not found"))
      case GSE.Unauthorized(_, _) => Unauthorized(jsonErr("Unauthorized"))
      case GSE.SessionFull(_)     => Conflict(jsonErr("Session is full"))
      case GSE.AlreadyJoined(_)   => Conflict(jsonErr("Already joined"))
      case GSE.CommandFailed(m)   => BadRequest(jsonErr(m))
    }

  private def isAnonymous(p: AuthPrincipal): Boolean =
    p == AuthPrincipal.anonymous

  private def principalFromName(name: String): AuthPrincipal =
    AuthPrincipal(userId = name, username = name)

  // GET /api/sessions
  def list: Action[AnyContent] = Action { req =>
    principalOrAnonymous(req) match {
      case Left(res) => res
      case Right(_) =>
        val dtos = service
          .listSessions()
          .map { case (id, info) => SessionMapper.toDto(id, info) }

        Ok(Json.toJson(dtos))
    }
  }

  // GET /api/sessions/:id
  def get(id: String): Action[AnyContent] = Action { req =>
    principalOrAnonymous(req) match {
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
    principalOrAnonymous(req) match {
      case Left(res) => res
      case Right(p0) =>
        req.body.validate[CreateSessionRequestDto] match {
          case JsError(e) =>
            BadRequest(Json.obj("error" -> "Invalid payload", "details" -> JsError.toJson(e)))

          case JsSuccess(dto, _) =>
            val sessionName = dto.name.trim
            if (sessionName.isEmpty) BadRequest(jsonErr("Session name must not be empty"))
            else {
              val hostName =
                if (isAnonymous(p0)) Option(dto.hostName).map(_.trim).filter(_.nonEmpty).getOrElse("host")
                else p0.username

              val principal =
                if (isAnonymous(p0)) principalFromName(hostName)
                else p0

              service.createSession(principal, hostName, sessionName) match {
                case Left(err) =>
                  toHttpError(err)

                case Right(created) =>
                  Ok(Json.toJson(SessionCreatedResponseDto(
                    sessionId = created.id.value,
                    hostToken = created.hostToken.value
                  )))
                    .withSession(
                      req.session +
                        ("sid" -> created.id.value) +
                        ("username" -> hostName) +
                        ("playerToken" -> created.hostToken.value)
                    )
              }
            }
        }
    }
  }

  // POST /api/sessions/:id/join
  def join(id: String): Action[JsValue] = Action(parse.json) { req =>
    principalOrAnonymous(req) match {
      case Left(res) => res
      case Right(p0) =>
        req.body.validate[JoinSessionRequestDto] match {
          case JsError(e) =>
            BadRequest(Json.obj("error" -> "Invalid payload", "details" -> JsError.toJson(e)))

          case JsSuccess(dto, _) =>
            val guestName =
              if (isAnonymous(p0)) Option(dto.playerName).map(_.trim).filter(_.nonEmpty).getOrElse("guest")
              else p0.username

            val principal =
              if (isAnonymous(p0)) principalFromName(guestName)
              else p0

            service.joinSession(principal, GameSessionId(id), guestName) match {
              case Left(err) =>
                toHttpError(err)

              case Right(joined) =>
                Ok(Json.toJson(SessionJoinedResponseDto(
                  sessionId    = id,
                  playerToken  = joined.guestToken.value
                )))
                  .withSession(
                    req.session +
                      ("sid" -> id) +
                      ("username" -> guestName) +
                      ("playerToken" -> joined.guestToken.value)
                  )
            }
        }
    }
  }

  // POST /api/sessions/:id/leave
  def leave(id: String): Action[AnyContent] = Action { req =>
    principalOrAnonymous(req) match {
      case Left(res) => res
      case Right(principal) =>
        service.leaveSession(principal, GameSessionId(id)) match {
          case Left(GSE.CommandFailed("Session closed")) =>
            Ok(jsonErr("Session closed")).withSession(req.session - "sid" - "username")

          case Left(err) =>
            toHttpError(err)

          case Right(_) =>
            Ok(Json.obj("ok" -> true)).withSession(req.session - "sid" - "username")
        }
    }
  }

  // POST /api/sessions/:id/start
  def start(id: String): Action[AnyContent] = Action { req =>
    principalOrAnonymous(req) match {
      case Left(res) => res
      case Right(principal) =>
        service.startSession(principal, GameSessionId(id)) match {
          case Left(err) =>
            toHttpError(err)

          case Right(ctx) =>
            val infoOpt = service.getSession(GameSessionId(id)).toOption
            val web = viewStateMapper.toWebState(ctx, Some(principal), infoOpt)
            eventHub.publish(GameSessionId(id), ctx)
            Ok(Json.toJson(web)).withSession(req.session + ("sid" -> id))
        }
    }
  }


}
