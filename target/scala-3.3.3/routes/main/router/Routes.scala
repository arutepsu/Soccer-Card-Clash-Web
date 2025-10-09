// @GENERATOR:play-routes-compiler
// @SOURCE:conf/routes

package router

import play.core.routing._
import play.core.routing.HandlerInvokerFactory._

import play.api.mvc._

import _root_.controllers.Assets.Asset

class Routes(
  override val errorHandler: play.api.http.HttpErrorHandler, 
  // @LINE:1
  UiController_0: controllers.UiController,
  // @LINE:2
  GameApiController_1: controllers.GameApiController,
  val prefix: String
) extends GeneratedRouter {

  @javax.inject.Inject()
  def this(errorHandler: play.api.http.HttpErrorHandler,
    // @LINE:1
    UiController_0: controllers.UiController,
    // @LINE:2
    GameApiController_1: controllers.GameApiController
  ) = this(errorHandler, UiController_0, GameApiController_1, "/")

  def withPrefix(addPrefix: String): Routes = {
    val prefix = play.api.routing.Router.concatPrefix(addPrefix, this.prefix)
    router.RoutesPrefix.setPrefix(prefix)
    new Routes(errorHandler, UiController_0, GameApiController_1, prefix)
  }

  private[this] val defaultPrefix: String = {
    if (this.prefix.endsWith("/")) "" else "/"
  }

  def documentation = List(
    ("""GET""", this.prefix, """controllers.UiController.index"""),
    ("""GET""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/state""", """controllers.GameApiController.state"""),
    ("""GET""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/stream""", """controllers.GameApiController.stream"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/command""", """controllers.GameApiController.command"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/new""", """controllers.GameApiController.newGame"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/new-ai""", """controllers.GameApiController.newGameAI"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/attack/""" + "$" + """idx<[^/]+>""", """controllers.GameApiController.attack(idx:Int)"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/double-attack/""" + "$" + """idx<[^/]+>""", """controllers.GameApiController.doubleAttack(idx:Int)"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/swap/""" + "$" + """idx<[^/]+>""", """controllers.GameApiController.regularSwap(idx:Int)"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/reverse-swap""", """controllers.GameApiController.reverseSwap()"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/boost/defender/""" + "$" + """idx<[^/]+>""", """controllers.GameApiController.boostDefender(idx:Int)"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/boost/goalkeeper""", """controllers.GameApiController.boostGoalkeeper()"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/undo""", """controllers.GameApiController.undo()"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/redo""", """controllers.GameApiController.redo()"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/save""", """controllers.GameApiController.save()"""),
    ("""GET""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/saves""", """controllers.GameApiController.showSaves()"""),
    ("""POST""", this.prefix + (if(this.prefix.endsWith("/")) "" else "/") + """api/load/""" + "$" + """idx<[^/]+>""", """controllers.GameApiController.loadSelect(idx:Int)"""),
    Nil
  ).foldLeft(Seq.empty[(String, String, String)]) { (s,e) => e.asInstanceOf[Any] match {
    case r @ (_,_,_) => s :+ r.asInstanceOf[(String, String, String)]
    case l => s ++ l.asInstanceOf[List[(String, String, String)]]
  }}


  // @LINE:1
  private[this] lazy val controllers_UiController_index0_route = Route("GET",
    PathPattern(List(StaticPart(this.prefix)))
  )
  private[this] lazy val controllers_UiController_index0_invoker = createInvoker(
    UiController_0.index,
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.UiController",
      "index",
      Nil,
      "GET",
      this.prefix + """""",
      """""",
      Seq()
    )
  )

  // @LINE:2
  private[this] lazy val controllers_GameApiController_state1_route = Route("GET",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/state")))
  )
  private[this] lazy val controllers_GameApiController_state1_invoker = createInvoker(
    GameApiController_1.state,
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "state",
      Nil,
      "GET",
      this.prefix + """api/state""",
      """""",
      Seq()
    )
  )

  // @LINE:3
  private[this] lazy val controllers_GameApiController_stream2_route = Route("GET",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/stream")))
  )
  private[this] lazy val controllers_GameApiController_stream2_invoker = createInvoker(
    GameApiController_1.stream,
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "stream",
      Nil,
      "GET",
      this.prefix + """api/stream""",
      """""",
      Seq()
    )
  )

  // @LINE:4
  private[this] lazy val controllers_GameApiController_command3_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/command")))
  )
  private[this] lazy val controllers_GameApiController_command3_invoker = createInvoker(
    GameApiController_1.command,
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "command",
      Nil,
      "POST",
      this.prefix + """api/command""",
      """""",
      Seq()
    )
  )

  // @LINE:5
  private[this] lazy val controllers_GameApiController_newGame4_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/new")))
  )
  private[this] lazy val controllers_GameApiController_newGame4_invoker = createInvoker(
    GameApiController_1.newGame,
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "newGame",
      Nil,
      "POST",
      this.prefix + """api/new""",
      """""",
      Seq()
    )
  )

  // @LINE:6
  private[this] lazy val controllers_GameApiController_newGameAI5_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/new-ai")))
  )
  private[this] lazy val controllers_GameApiController_newGameAI5_invoker = createInvoker(
    GameApiController_1.newGameAI,
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "newGameAI",
      Nil,
      "POST",
      this.prefix + """api/new-ai""",
      """""",
      Seq()
    )
  )

  // @LINE:8
  private[this] lazy val controllers_GameApiController_attack6_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/attack/"), DynamicPart("idx", """[^/]+""",true)))
  )
  private[this] lazy val controllers_GameApiController_attack6_invoker = createInvoker(
    GameApiController_1.attack(fakeValue[Int]),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "attack",
      Seq(classOf[Int]),
      "POST",
      this.prefix + """api/attack/""" + "$" + """idx<[^/]+>""",
      """""",
      Seq()
    )
  )

  // @LINE:9
  private[this] lazy val controllers_GameApiController_doubleAttack7_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/double-attack/"), DynamicPart("idx", """[^/]+""",true)))
  )
  private[this] lazy val controllers_GameApiController_doubleAttack7_invoker = createInvoker(
    GameApiController_1.doubleAttack(fakeValue[Int]),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "doubleAttack",
      Seq(classOf[Int]),
      "POST",
      this.prefix + """api/double-attack/""" + "$" + """idx<[^/]+>""",
      """""",
      Seq()
    )
  )

  // @LINE:11
  private[this] lazy val controllers_GameApiController_regularSwap8_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/swap/"), DynamicPart("idx", """[^/]+""",true)))
  )
  private[this] lazy val controllers_GameApiController_regularSwap8_invoker = createInvoker(
    GameApiController_1.regularSwap(fakeValue[Int]),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "regularSwap",
      Seq(classOf[Int]),
      "POST",
      this.prefix + """api/swap/""" + "$" + """idx<[^/]+>""",
      """""",
      Seq()
    )
  )

  // @LINE:12
  private[this] lazy val controllers_GameApiController_reverseSwap9_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/reverse-swap")))
  )
  private[this] lazy val controllers_GameApiController_reverseSwap9_invoker = createInvoker(
    GameApiController_1.reverseSwap(),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "reverseSwap",
      Nil,
      "POST",
      this.prefix + """api/reverse-swap""",
      """""",
      Seq()
    )
  )

  // @LINE:14
  private[this] lazy val controllers_GameApiController_boostDefender10_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/boost/defender/"), DynamicPart("idx", """[^/]+""",true)))
  )
  private[this] lazy val controllers_GameApiController_boostDefender10_invoker = createInvoker(
    GameApiController_1.boostDefender(fakeValue[Int]),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "boostDefender",
      Seq(classOf[Int]),
      "POST",
      this.prefix + """api/boost/defender/""" + "$" + """idx<[^/]+>""",
      """""",
      Seq()
    )
  )

  // @LINE:15
  private[this] lazy val controllers_GameApiController_boostGoalkeeper11_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/boost/goalkeeper")))
  )
  private[this] lazy val controllers_GameApiController_boostGoalkeeper11_invoker = createInvoker(
    GameApiController_1.boostGoalkeeper(),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "boostGoalkeeper",
      Nil,
      "POST",
      this.prefix + """api/boost/goalkeeper""",
      """""",
      Seq()
    )
  )

  // @LINE:17
  private[this] lazy val controllers_GameApiController_undo12_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/undo")))
  )
  private[this] lazy val controllers_GameApiController_undo12_invoker = createInvoker(
    GameApiController_1.undo(),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "undo",
      Nil,
      "POST",
      this.prefix + """api/undo""",
      """""",
      Seq()
    )
  )

  // @LINE:18
  private[this] lazy val controllers_GameApiController_redo13_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/redo")))
  )
  private[this] lazy val controllers_GameApiController_redo13_invoker = createInvoker(
    GameApiController_1.redo(),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "redo",
      Nil,
      "POST",
      this.prefix + """api/redo""",
      """""",
      Seq()
    )
  )

  // @LINE:19
  private[this] lazy val controllers_GameApiController_save14_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/save")))
  )
  private[this] lazy val controllers_GameApiController_save14_invoker = createInvoker(
    GameApiController_1.save(),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "save",
      Nil,
      "POST",
      this.prefix + """api/save""",
      """""",
      Seq()
    )
  )

  // @LINE:21
  private[this] lazy val controllers_GameApiController_showSaves15_route = Route("GET",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/saves")))
  )
  private[this] lazy val controllers_GameApiController_showSaves15_invoker = createInvoker(
    GameApiController_1.showSaves(),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "showSaves",
      Nil,
      "GET",
      this.prefix + """api/saves""",
      """""",
      Seq()
    )
  )

  // @LINE:22
  private[this] lazy val controllers_GameApiController_loadSelect16_route = Route("POST",
    PathPattern(List(StaticPart(this.prefix), StaticPart(this.defaultPrefix), StaticPart("api/load/"), DynamicPart("idx", """[^/]+""",true)))
  )
  private[this] lazy val controllers_GameApiController_loadSelect16_invoker = createInvoker(
    GameApiController_1.loadSelect(fakeValue[Int]),
    play.api.routing.HandlerDef(this.getClass.getClassLoader,
      "router",
      "controllers.GameApiController",
      "loadSelect",
      Seq(classOf[Int]),
      "POST",
      this.prefix + """api/load/""" + "$" + """idx<[^/]+>""",
      """""",
      Seq()
    )
  )


  def routes: PartialFunction[RequestHeader, Handler] = {
  
    // @LINE:1
    case controllers_UiController_index0_route(params@_) =>
      call { 
        controllers_UiController_index0_invoker.call(UiController_0.index)
      }
  
    // @LINE:2
    case controllers_GameApiController_state1_route(params@_) =>
      call { 
        controllers_GameApiController_state1_invoker.call(GameApiController_1.state)
      }
  
    // @LINE:3
    case controllers_GameApiController_stream2_route(params@_) =>
      call { 
        controllers_GameApiController_stream2_invoker.call(GameApiController_1.stream)
      }
  
    // @LINE:4
    case controllers_GameApiController_command3_route(params@_) =>
      call { 
        controllers_GameApiController_command3_invoker.call(GameApiController_1.command)
      }
  
    // @LINE:5
    case controllers_GameApiController_newGame4_route(params@_) =>
      call { 
        controllers_GameApiController_newGame4_invoker.call(GameApiController_1.newGame)
      }
  
    // @LINE:6
    case controllers_GameApiController_newGameAI5_route(params@_) =>
      call { 
        controllers_GameApiController_newGameAI5_invoker.call(GameApiController_1.newGameAI)
      }
  
    // @LINE:8
    case controllers_GameApiController_attack6_route(params@_) =>
      call(params.fromPath[Int]("idx", None)) { (idx) =>
        controllers_GameApiController_attack6_invoker.call(GameApiController_1.attack(idx))
      }
  
    // @LINE:9
    case controllers_GameApiController_doubleAttack7_route(params@_) =>
      call(params.fromPath[Int]("idx", None)) { (idx) =>
        controllers_GameApiController_doubleAttack7_invoker.call(GameApiController_1.doubleAttack(idx))
      }
  
    // @LINE:11
    case controllers_GameApiController_regularSwap8_route(params@_) =>
      call(params.fromPath[Int]("idx", None)) { (idx) =>
        controllers_GameApiController_regularSwap8_invoker.call(GameApiController_1.regularSwap(idx))
      }
  
    // @LINE:12
    case controllers_GameApiController_reverseSwap9_route(params@_) =>
      call { 
        controllers_GameApiController_reverseSwap9_invoker.call(GameApiController_1.reverseSwap())
      }
  
    // @LINE:14
    case controllers_GameApiController_boostDefender10_route(params@_) =>
      call(params.fromPath[Int]("idx", None)) { (idx) =>
        controllers_GameApiController_boostDefender10_invoker.call(GameApiController_1.boostDefender(idx))
      }
  
    // @LINE:15
    case controllers_GameApiController_boostGoalkeeper11_route(params@_) =>
      call { 
        controllers_GameApiController_boostGoalkeeper11_invoker.call(GameApiController_1.boostGoalkeeper())
      }
  
    // @LINE:17
    case controllers_GameApiController_undo12_route(params@_) =>
      call { 
        controllers_GameApiController_undo12_invoker.call(GameApiController_1.undo())
      }
  
    // @LINE:18
    case controllers_GameApiController_redo13_route(params@_) =>
      call { 
        controllers_GameApiController_redo13_invoker.call(GameApiController_1.redo())
      }
  
    // @LINE:19
    case controllers_GameApiController_save14_route(params@_) =>
      call { 
        controllers_GameApiController_save14_invoker.call(GameApiController_1.save())
      }
  
    // @LINE:21
    case controllers_GameApiController_showSaves15_route(params@_) =>
      call { 
        controllers_GameApiController_showSaves15_invoker.call(GameApiController_1.showSaves())
      }
  
    // @LINE:22
    case controllers_GameApiController_loadSelect16_route(params@_) =>
      call(params.fromPath[Int]("idx", None)) { (idx) =>
        controllers_GameApiController_loadSelect16_invoker.call(GameApiController_1.loadSelect(idx))
      }
  }
}
