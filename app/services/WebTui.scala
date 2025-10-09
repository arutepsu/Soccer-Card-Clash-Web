package services

import javax.inject._
import java.io.{ByteArrayOutputStream, PrintStream}
import java.util.concurrent.atomic.{AtomicLong, AtomicReference}
import de.htwg.se.soccercardclash.controller.IController
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder
import de.htwg.se.soccercardclash.view.tui.{Tui, Prompter, TuiKeys, PromptState}
import de.htwg.se.soccercardclash.util._ // brings ObservableEvent, etc.

/** A TUI that records whatever it prints, both on commands and on events. */
@Singleton
class WebTui @Inject() (controller: IController, holder: IGameContextHolder)
  extends Tui(controller, holder) {

  private val lastText = new AtomicReference[String]("")
  private val revision = new AtomicLong(0L)
  
  /** Capture System.out during `body`, stash text, and bump revision if non-empty. */
  private def capture[A](body: => A): A = {
    val baos = new ByteArrayOutputStream()
    val ps   = new PrintStream(baos, true, "UTF-8")
    Console.withOut(ps) {
      val res = body
      ps.flush()
      val s = baos.toString("UTF-8")
      if (s.nonEmpty) {
        lastText.set(s)
        revision.incrementAndGet()
      }
      res
    }
  }


  override def processInputLine(in: String): Unit = capture { super.processInputLine(in) }

  override def update(e: ObservableEvent): Unit = capture {
    println(s"[event] " + e.toString)     // debug
    super.update(e)
  }


  /** What the TUI printed last (or the Main Menu if nothing yet). */
  def snapshot(): String = {
    val s = lastText.get()
    if (s == null || s.isEmpty) {
      capture { new Prompter(controller, holder).promptMainMenu() }
      lastText.get()
    } else s
  }

  /** Monotonic tick that changes whenever snapshot text changes. */
  def version(): Long = revision.get()
}
