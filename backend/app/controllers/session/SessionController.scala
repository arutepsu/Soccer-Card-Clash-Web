package app.controllers.session

import javax.inject.*
import scala.concurrent.ExecutionContext

import play.api.mvc.*
import play.api.libs.json.*

import app.controllers.support.ControllerSupport
import app.session.*
import app.session.GameSessionError as GSE
import app.auth.SupabaseJwt
import app.mapping.IViewStateMapper
import app.api.eventHub.GameEventHub

@Singleton
final class SessionController @Inject()(
  cc: ControllerComponents,
  service: IGameSessionService,
  viewStateMapper: IViewStateMapper,
  eventHub: GameEventHub,
  jwt: SupabaseJwt
)(using ec: ExecutionContext)
  extends AbstractController(cc)
    with ISessionController
    with ControllerSupport {

  private def jsonErr(msg: String) = Json.obj("error" -> msg)

  private def toHttpError(e: GameSessionError): Result =
    e match {
      case GSE.NotFound(_)        => NotFound(jsonErr("Session not found"))
      case GSE.Unauthorized(_, _) => Unauthorized(jsonErr("Unauthorized"))
      case GSE.InvalidToken(_)    => Unauthorized(jsonErr("Invalid player token"))
      case GSE.SessionFull(_)     => Conflict(jsonErr("Session is full"))
      case GSE.AlreadyJoined(_)   => Conflict(jsonErr("Already joined"))
      case GSE.CommandFailed(m)   => BadRequest(jsonErr(m))
    }

  // GET /api/sessions
  def list: Action[AnyContent] = Action { req =>
    given SupabaseJwt = jwt
    requirePrincipal(req) match {
      case Left(res) => res
      case Right(_)  =>
        val dtos = service.listSessions().map { case (id, info) => SessionMapper.toDto(id, info) }
        Ok(Json.toJson(dtos))
    }
  }

  // GET /api/sessions/:id
  def get(id: String): Action[AnyContent] = Action { req =>
    given SupabaseJwt = jwt
    requirePrincipal(req) match {
      case Left(res) => res
      case Right(_)  =>
        service.getSession(GameSessionId(id)) match {
          case Left(err)   => toHttpError(err)
          case Right(info) => Ok(Json.toJson(SessionMapper.toDto(GameSessionId(id), info)))
        }
    }
  }

  // POST /api/sessions
  def create: Action[JsValue] = Action(parse.json) { req =>
    given SupabaseJwt = jwt
    requirePrincipal(req) match {
      case Left(res) => res

      case Right(p) =>
        req.body.validate[CreateSessionRequestDto] match {
          case JsError(e) =>
            BadRequest(Json.obj("error" -> "Invalid payload", "details" -> JsError.toJson(e)))

          case JsSuccess(dto, _) =>
            val sessionName = dto.name.trim
            if (sessionName.isEmpty) BadRequest(jsonErr("Session name must not be empty"))
            else {
              val hostName =
                Option(dto.hostName).map(_.trim).filter(_.nonEmpty)
                  .orElse(p.nickname.map(_.trim).filter(_.nonEmpty))
                  .getOrElse("host")


              service.createSession(p, hostName, sessionName) match {
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
                        ("nickname" -> hostName) +
                        ("playerToken" -> created.hostToken.value)
                    )
              }
            }
        }
    }
  }

  // POST /api/sessions/:id/join
  def join(id: String): Action[JsValue] = Action(parse.json) { req =>
    given SupabaseJwt = jwt
    requirePrincipal(req) match {
      case Left(res) => res

      case Right(p) =>
        req.body.validate[JoinSessionRequestDto] match {
          case JsError(e) =>
            BadRequest(Json.obj("error" -> "Invalid payload", "details" -> JsError.toJson(e)))

          case JsSuccess(dto, _) =>
            val guestName =
              Option(dto.playerName).map(_.trim).filter(_.nonEmpty)
                .orElse(p.nickname.map(_.trim).filter(_.nonEmpty))
                .getOrElse("guest")


            service.joinSession(p, GameSessionId(id), guestName) match {
              case Left(err) =>
                toHttpError(err)

              case Right(joined) =>
                Ok(Json.toJson(SessionJoinedResponseDto(
                  sessionId   = id,
                  playerToken = joined.guestToken.value
                )))
                  .withSession(
                    req.session +
                      ("sid" -> id) +
                      ("nickname" -> guestName) +
                      ("playerToken" -> joined.guestToken.value)
                  )
            }
        }
    }
  }

  // POST /api/sessions/:id/leave
  def leave(id: String): Action[AnyContent] = Action { req =>
    given SupabaseJwt = jwt
    (requirePrincipal(req), requirePlayerToken(req)) match {
      case (Left(res), _) => res
      case (_, Left(res)) => res

      case (Right(principal), Right(token)) =>
        service.leaveSession(principal, token, GameSessionId(id)) match {
          case Left(GSE.CommandFailed("Session closed")) =>
            Ok(jsonErr("Session closed"))
              .withSession(req.session - "sid" - "nickname" - "playerToken")

          case Left(err) =>
            toHttpError(err)

          case Right(_) =>
            Ok(Json.obj("ok" -> true))
              .withSession(req.session - "sid" - "nickname" - "playerToken")
        }
    }
  }

  // POST /api/sessions/:id/start
  def start(id: String): Action[AnyContent] = Action { req =>

    given SupabaseJwt = jwt
    val pE = requirePrincipal(req)

    val tE = requirePlayerToken(req)

    (pE, tE) match {
      case (Left(res), _) => res
      case (_, Left(res)) => res
      case (Right(principal), Right(token)) =>

        val r = service.startSession(principal, token, GameSessionId(id))


        r match {
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
