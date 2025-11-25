package app.services

import akka.stream.scaladsl.Source
import app.protocol.Envelope

trait IGamePushService {
  def eventStream(gameId: String): Source[Envelope, _]

  def handleCommand(msg: Envelope): Unit
}
