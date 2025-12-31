package controllers.fileIO

import javax.inject._
import play.api.mvc._
import play.api.libs.json._

import app.fileIO.IFileIO
import app.api.usecases.IGameUseCases
import app.api.context.IGameContextRepository
import app.controllers.support.ControllerSupport
import app.session.GameSessionId
import app.auth.SupabaseJwt

@Singleton
final class FileIOController @Inject()(
  cc: ControllerComponents,
  fileIO: IFileIO,
  gameUseCases: IGameUseCases,
  repo: IGameContextRepository,
  jwt: SupabaseJwt
) extends AbstractController(cc)
    with ControllerSupport {

  private val JSON_CT = "application/json"

  private def jsonErr(msg: String) = Json.obj("error" -> msg)

  // GET /api/files/list
  def listSavedGames(): Action[AnyContent] = Action { implicit request =>
    val gamesFolder = new java.io.File("games/")
    if (!gamesFolder.exists()) {
      Ok(Json.obj("files" -> Json.arr())).as(JSON_CT)
    } else {
      val files = gamesFolder.listFiles()
        .filter(_.isFile)
        .filter(_.getName.endsWith(".json"))
        .map(_.getName)
        .toSeq

      Ok(Json.obj("files" -> files)).as(JSON_CT)
    }
  }

  // POST /api/files/load
  // body: { "fileName": "abc.json" }
  def loadGameFromFile(): Action[JsValue] = Action(parse.json) { implicit request =>
    given SupabaseJwt = jwt

    requirePrincipal(request) match {
      case Left(res) => res.as(JSON_CT)

      case Right(principal) =>
        val sid = getOrCreateSid(request)
        val fileName = (request.body \ "fileName").asOpt[String].getOrElse("game.json")

        gameUseCases.load(fileName, sid, Some(principal)) match {
          case Right(webState) =>
            Ok(Json.toJson(webState)).as(JSON_CT)

          case Left(err) =>
            NotFound(Json.obj(
              "error"     -> err.message,
              "fileName"  -> fileName,
              "sessionId" -> sid.value
            )).as(JSON_CT)
        }
    }
  }

  // POST /api/files/save
  // body: { "fileName": "abc.json" }
  def saveGameToFile(): Action[JsValue] = Action(parse.json) { implicit request =>
    given SupabaseJwt = jwt

    requirePrincipal(request) match {
      case Left(res) => res.as(JSON_CT)

      case Right(principal) =>
        val sid = getOrCreateSid(request)
        val fileName = (request.body \ "fileName").asOpt[String].getOrElse("game.json")

        println(s"[FileIOController] Save requested. sid='${sid.value}', fileName='$fileName'")

        gameUseCases.save(sid, Some(principal)) match {
          case Left(err) =>
            InternalServerError(Json.obj(
              "success"   -> false,
              "error"     -> err.message,
              "sessionId" -> sid.value
            )).as(JSON_CT)

          case Right(webState) =>
            repo.get(sid) match {
              case None =>
                NotFound(Json.obj(
                  "success"   -> false,
                  "error"     -> s"No game context for sid '${sid.value}'",
                  "sessionId" -> sid.value
                )).as(JSON_CT)

              case Some(ctx) =>
                try {
                  fileIO.save(ctx.state, fileName)
                  Ok(Json.obj(
                    "success"   -> true,
                    "fileName"  -> fileName,
                    "message"   -> s"Game saved to $fileName",
                    "sessionId" -> sid.value,
                    "state"     -> Json.toJson(webState)
                  )).as(JSON_CT)
                } catch {
                  case t: Throwable =>
                    println(s"[FileIOController] File save failed: ${t.getMessage}")
                    InternalServerError(Json.obj(
                      "success" -> false,
                      "error"   -> s"File write failed: ${t.getMessage}"
                    )).as(JSON_CT)
                }
            }
        }
    }
  }

  // DELETE /api/files/delete
  // body: { "fileName": "abc.json" }
  def deleteGameFile(): Action[JsValue] = Action(parse.json) { implicit request =>
    val fileName = (request.body \ "fileName").asOpt[String]

    fileName match {
      case None =>
        BadRequest(Json.obj(
          "success" -> false,
          "error"   -> "fileName is required"
        )).as(JSON_CT)

      case Some(name) =>
        val file = new java.io.File(s"games/$name")
        if (file.exists() && file.delete()) {
          Ok(Json.obj(
            "success" -> true,
            "message" -> s"Deleted $name"
          )).as(JSON_CT)
        } else {
          NotFound(Json.obj(
            "success" -> false,
            "error"   -> s"File $name not found or could not be deleted"
          )).as(JSON_CT)
        }
    }
  }
}
