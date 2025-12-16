package controllers.fileIO

import javax.inject._
import play.api.mvc._
import play.api.libs.json._
import app.fileIO.IFileIO
import app.api.usecases.IGameUseCases
import app.api.context.IGameContextRepository
import app.models.AppError
import app.models.state.WebGameState
import app.mapping.ViewStateMapper
import de.htwg.se.soccercardclash.model.gameComponent.context.GameContext
import app.session.GameSessionId
import app.models.state.WebGameState
import app.session.GameSessionId

@Singleton
class FileIOController @Inject()(
  cc: ControllerComponents,
  fileIO: IFileIO,
  gameUseCases: IGameUseCases,
  repo: IGameContextRepository
) extends AbstractController(cc) {

  private val JSON = "application/json"

  /* GET /api/files/list
   * Lists all saved game files
   */
  def listSavedGames(): Action[AnyContent] = Action { implicit request =>
    val gamesFolder = new java.io.File("games/")
    if (!gamesFolder.exists()) {
      Ok(Json.obj("files" -> Json.arr())).as(JSON)
    } else {
      val files = gamesFolder.listFiles()
        .filter(_.isFile)
        .filter(_.getName.endsWith(".json"))
        .map(_.getName)
        .toSeq
      Ok(Json.obj("files" -> files)).as(JSON)
    }
  }

  /*
   * POST /api/files/load
   * loads a game from a file
   * body: { "fileName": "abc.json", "sessionId": "some-session-id" }
   */
  def loadGameFromFile(): Action[JsValue] = Action(parse.json) { implicit request =>
    val fileName  = (request.body \ "fileName").asOpt[String].getOrElse("game.json")
    val sessionId = (request.body \ "sessionId").asOpt[String].getOrElse("default")
    val sid       = GameSessionId(sessionId)

    // now GameUseCases works with GameSessionId
    gameUseCases.load(fileName, sid) match {
      case Right(webState) =>
        Ok(Json.toJson(webState)).as(JSON)

      case Left(error) =>
        NotFound(Json.obj(
          "error"     -> error.message,
          "fileName"  -> fileName,
          "sessionId" -> sid.value
        )).as(JSON)
    }
  }

  /*
   * POST /api/files/save
   * saves the game to a file
   * body: { "fileName": "abc.json", "sessionId": "some-session-id" }
   */
  def saveGameToFile(): Action[JsValue] = Action(parse.json) { implicit request =>
    val fileName  = (request.body \ "fileName").asOpt[String].getOrElse("game.json")
    val sessionId = (request.body \ "sessionId").asOpt[String].getOrElse("default")
    val sid       = GameSessionId(sessionId)

    println(s"[FileIOController] Save requested. sessionId='${sid.value}', fileName='$fileName'")

    gameUseCases.save(sid) match {
      case Right(webState) =>
        repo.get(sid) match {
          case Some(ctx) =>
            try {
              // ctx.state = domain game state
              fileIO.save(ctx.state, fileName)
              Ok(Json.obj(
                "success"   -> true,
                "fileName"  -> fileName,
                "message"   -> s"Game saved to $fileName",
                "sessionId" -> sid.value,
                "state"     -> Json.toJson(webState)
              )).as(JSON)
            } catch {
              case e: Throwable =>
                println(s"[FileIOController] File save failed: ${e.getMessage}")
                InternalServerError(Json.obj(
                  "success" -> false,
                  "error"   -> s"File write failed: ${e.getMessage}"
                )).as(JSON)
            }

          case None =>
            println(s"[FileIOController] No context found for sessionId='${sid.value}'")
            NotFound(Json.obj(
              "success" -> false,
              "error"   -> s"No game context for sessionId '${sid.value}'"
            )).as(JSON)
        }

      case Left(error) =>
        println(s"[FileIOController] gameUseCases.save failed: ${error.message}")
        InternalServerError(Json.obj(
          "success"   -> false,
          "error"     -> error.message,
          "sessionId" -> sid.value
        )).as(JSON)
    }
  }

  /*
   * DELETE /api/files/delete
   * Deletes a game file
   * body: { "fileName": "abc.json" }
   */
  def deleteGameFile(): Action[JsValue] = Action(parse.json) { implicit request =>
    val fileName = (request.body \ "fileName").asOpt[String]

    fileName match {
      case Some(name) =>
        val file = new java.io.File(s"games/$name")
        if (file.exists() && file.delete()) {
          Ok(Json.obj(
            "success" -> true,
            "message" -> s"Deleted $name"
          )).as(JSON)
        } else {
          NotFound(Json.obj(
            "success" -> false,
            "error"   -> s"File $name not found or could not be deleted"
          )).as(JSON)
        }

      case None =>
        BadRequest(Json.obj(
          "success" -> false,
          "error"   -> "fileName is required"
        )).as(JSON)
    }
  }
}