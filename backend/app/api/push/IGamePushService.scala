package app.api.push

import akka.stream.scaladsl.Source
import app.api.push.protocol.Envelope

trait IGamePushService {
  def eventStream(gameId: String): Source[Envelope, _]

  def handleCommand(msg: Envelope): Unit
}
