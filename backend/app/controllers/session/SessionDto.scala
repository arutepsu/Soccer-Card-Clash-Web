package app.controllers.session

import play.api.libs.json.*
import app.session.{GameSessionId, SessionInfo}

enum SessionStatus:
  case Waiting, Full

object SessionStatus:
  given Writes[SessionStatus] = Writes { s =>
    JsString(s.toString)
  }


final case class SessionDto(
  id: String,
  name: String,
  hostName: String,
  playerCount: Int,
  status: SessionStatus
)

object SessionDto:
  given Writes[SessionDto] = Json.writes[SessionDto]

final case class CreateSessionRequestDto(hostName: String, name: String)
object CreateSessionRequestDto:
  given Reads[CreateSessionRequestDto] = Json.reads[CreateSessionRequestDto]

final case class JoinSessionRequestDto(playerName: String)
object JoinSessionRequestDto:
  given Reads[JoinSessionRequestDto] = Json.reads[JoinSessionRequestDto]

final case class SessionCreatedResponseDto(sessionId: String, hostToken: String)
object SessionCreatedResponseDto:
  given Writes[SessionCreatedResponseDto] = Json.writes[SessionCreatedResponseDto]

final case class SessionJoinedResponseDto(sessionId: String, playerToken: String)
object SessionJoinedResponseDto:
  given Writes[SessionJoinedResponseDto] = Json.writes[SessionJoinedResponseDto]

object SessionMapper:
  def toDto(id: GameSessionId, info: SessionInfo): SessionDto =
    val count = if info.guestName.isDefined then 2 else 1
    SessionDto(
      id = id.value,
      name = info.sessionName,
      hostName = info.hostName,
      playerCount = count,
      status = if count >= 2 then SessionStatus.Full else SessionStatus.Waiting
    )
