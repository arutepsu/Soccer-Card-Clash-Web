package app.controllers.stream

import javax.inject._
import scala.concurrent.{ExecutionContext, Future, Promise}
import scala.concurrent.duration._

import akka.actor.ActorSystem
import akka.stream.Materializer
import akka.stream.OverflowStrategy
import akka.stream.scaladsl.Source
import akka.util.ByteString

import play.api.libs.json._
import play.api.mvc._

import controllers.support.ControllerSupport
import app.controllers.stream.IGameStreamController
import app.api.eventHub.{GameEvent, GameEventHub}

@Singleton
final class GameStreamController @Inject()(
  cc: ControllerComponents,
  eventHub: GameEventHub
)(implicit ec: ExecutionContext, system: ActorSystem, mat: Materializer)
  extends AbstractController(cc)
  with ControllerSupport
  with IGameStreamController {

  override def sse: Action[AnyContent] = Action.async { implicit req =>
    requirePrincipal(req) match {
      case Left(res) => Future.successful(res)

      case Right(_) =>
        val sid = getOrCreateSid(req)

        val (queue, src) =
          Source.queue[GameEvent](32, OverflowStrategy.dropHead).preMaterialize()

        val unsubscribe = eventHub.subscribe(sid) { ev =>
          queue.offer(ev); ()
        }

        queue.watchCompletion().foreach(_ => unsubscribe())(ec)

        val eventSource =
          src.map { ev =>
            val json = Json.obj(
              "eventId" -> ev.eventId,
              "state"   -> Json.toJson(ev.state)
            )
            ByteString(s"data: ${Json.stringify(json)}\n\n")
          }

        Future.successful(
          Ok.chunked(eventSource)
            .as("text/event-stream")
            .addingToSession("sid" -> sid.value)
        )
    }
  }

  override def comet(lastEventId: Long): Action[AnyContent] = Action.async { implicit req =>
    requirePrincipal(req) match {
      case Left(res) => Future.successful(res)

      case Right(_) =>
        val sid = getOrCreateSid(req)
        val pending = eventHub.getSince(sid, lastEventId)

        if (pending.nonEmpty) {
          val lines = pending.map { ev =>
            Json.stringify(Json.obj("eventId" -> ev.eventId, "state" -> Json.toJson(ev.state)))
          }
          Future.successful(
            Ok(lines.mkString("\n"))
              .as("application/json")
              .addingToSession("sid" -> sid.value)
          )
        } else {
          val p = Promise[Result]()
          var unsubscribe: () => Unit = () => ()

          unsubscribe =
            eventHub.subscribe(sid) { ev =>
              if (ev.eventId > lastEventId && !p.isCompleted) {
                val all = eventHub.getSince(sid, lastEventId)
                val lines = all.map { e =>
                  Json.stringify(Json.obj("eventId" -> e.eventId, "state" -> Json.toJson(e.state)))
                }
                p.trySuccess(
                  Ok(lines.mkString("\n"))
                    .as("application/json")
                    .addingToSession("sid" -> sid.value)
                )
                unsubscribe()
              }
            }

          system.scheduler.scheduleOnce(25.seconds) {
            if (!p.isCompleted)
              p.trySuccess(Ok("").as("application/json").addingToSession("sid" -> sid.value))
            unsubscribe()
          }(ec)

          p.future
        }
    }
  }
}
