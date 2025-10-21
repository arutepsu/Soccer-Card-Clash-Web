package services

import javax.inject._
import java.io.{ByteArrayOutputStream, PrintStream}
import java.util.concurrent.atomic.{AtomicLong, AtomicReference, AtomicBoolean}
import de.htwg.se.soccercardclash.controller.IController
import de.htwg.se.soccercardclash.controller.contextHolder.IGameContextHolder
import de.htwg.se.soccercardclash.view.tui.{Tui, Prompter, TuiKeys, PromptState, IPrompter}
import de.htwg.se.soccercardclash.util._

@Singleton
class WebTui @Inject()(controller: IController, holder: IGameContextHolder)
  extends Tui(controller, holder) {

  private val revision = new AtomicLong(0L)
  private val lastText = new AtomicReference[String]("")
  private val booted   = new AtomicBoolean(false)
  private val prompter: IPrompter = new Prompter(controller, holder)

  private object Buf {
    private val sb = new StringBuilder
    def append(s: String): Unit = this.synchronized { if (s.nonEmpty) sb.append(s) }
    def drain(): String = this.synchronized {
      if (sb.isEmpty) "" else { val out = sb.toString; sb.clear(); out }
    }
    def snapshot(): String = this.synchronized(sb.toString)
    def isEmpty: Boolean = this.synchronized(sb.isEmpty)
  }

  private def capture[A](body: => A): A = {
    val baos = new ByteArrayOutputStream()
    val ps   = new PrintStream(baos, true, "UTF-8")
    Console.withOut(ps) {
      val res = body
      ps.flush()
      val s = baos.toString("UTF-8")
      if (s.nonEmpty) {
        lastText.set(s)
        Buf.append(s)
        revision.incrementAndGet()
      }
      res
    }
  }

  private def showWelcomeOnce(): Unit = {
    if (booted.compareAndSet(false, true)) {
      capture { prompter.promptMainMenu() }
    }
  }

  def bootOnce(): Unit = showWelcomeOnce()

  def runAndDrain(body: => Any): String = {
    if (!booted.get()) showWelcomeOnce()
    capture { body }
    Buf.drain()
  }

  override def processInputLine(in: String): Unit = capture { super.processInputLine(in) }
  override def update(e: ObservableEvent): Unit   = capture { super.update(e) }

  def drain(): String = { if (!booted.get()) showWelcomeOnce(); Buf.drain() }
  def snapshot(): String = { if (!booted.get()) showWelcomeOnce(); Buf.snapshot() }
  def version(): Long = revision.get()
}
