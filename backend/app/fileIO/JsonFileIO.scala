package app.fileIO

import de.htwg.se.soccercardclash.model.gameComponent.IGameState
import de.htwg.se.soccercardclash.model.gameComponent.service.GameDeserializer
import play.api.libs.json.*

import java.io.{File, PrintWriter}
import javax.inject.{Inject, Singleton}
import scala.io.Source
import scala.util.{Try, Success, Failure}

@Singleton
class JsonFileIO @Inject()(gameDeserializer: GameDeserializer) extends IFileIO {

  private val folderPath = "games/"
  
  /**
   loads a GameState from a JSON file
   */
  override def load(fileName: String): Option[IGameState] = {
    ensureFolderExists()
    val filePath = s"$folderPath$fileName"
    readJsonFromFile(filePath).flatMap(parseGameState)
  }

  /**
   saves gamestate to a JSON file
   */
  override def save(gameState: IGameState, fileName: String): Unit = {
    ensureFolderExists()
    val filePath = s"$folderPath$fileName"
    writeJsonToFile(filePath, gameState.toJson)
  }

  private def readJsonFromFile(path: String): Option[JsObject] =
    Try {
      val source = Source.fromFile(path)
      val content = source.getLines().mkString
      source.close()
      Json.parse(content).as[JsObject]
    } match {
      case Success(json) => Some(json)
      case Failure(ex) =>
        println(s"Error reading JSON from file $path: ${ex.getMessage}")
        None
    }

  private def parseGameState(json: JsObject): Option[IGameState] =
    Try(gameDeserializer.fromJson(json)) match {
      case Success(state) => Some(state)
      case Failure(ex) =>
        println(s"Error parsing GameState: ${ex.getMessage}")
        None
    }

  private def ensureFolderExists(): Unit = {
    val folder = new File(folderPath)
    if (!folder.exists()) {
      val ok = folder.mkdirs()
      if (!ok) println(s"[JsonFileIO] Could not create folder '${folder.getAbsolutePath}'")
    }
  }

  private def writeJsonToFile(path: String, json: JsValue): Unit =
    Try {
      val pw = new PrintWriter(new File(path))
      try pw.write(Json.prettyPrint(json))
      finally pw.close()
    } match {
      case Success(_) => println(s"Successfully saved game to $path")
      case Failure(ex) => println(s"Error writing JSON to file $path: ${ex.getMessage}")
    }
}
