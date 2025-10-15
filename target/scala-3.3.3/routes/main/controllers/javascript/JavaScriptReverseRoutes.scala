// @GENERATOR:play-routes-compiler
// @SOURCE:conf/routes

import play.api.routing.JavaScriptReverseRoute


import _root_.controllers.Assets.Asset

// @LINE:1
package controllers.javascript {

  // @LINE:1
  class ReverseUiController(_prefix: => String) {

    def _defaultPrefix: String = {
      if (_prefix.endsWith("/")) "" else "/"
    }

  
    // @LINE:1
    def index: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.UiController.index",
      """
        function() {
          return _wA({method:"GET", url:"""" + _prefix + """"})
        }
      """
    )
  
  }

  // @LINE:2
  class ReverseGameApiController(_prefix: => String) {

    def _defaultPrefix: String = {
      if (_prefix.endsWith("/")) "" else "/"
    }

  
    // @LINE:12
    def reverseSwap: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.reverseSwap",
      """
        function() {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/reverse-swap"})
        }
      """
    )
  
    // @LINE:17
    def undo: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.undo",
      """
        function() {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/undo"})
        }
      """
    )
  
    // @LINE:2
    def state: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.state",
      """
        function() {
          return _wA({method:"GET", url:"""" + _prefix + { _defaultPrefix } + """" + "api/state"})
        }
      """
    )
  
    // @LINE:18
    def redo: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.redo",
      """
        function() {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/redo"})
        }
      """
    )
  
    // @LINE:8
    def attack: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.attack",
      """
        function(idx0) {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/attack/" + encodeURIComponent((""" + implicitly[play.api.mvc.PathBindable[Int]].javascriptUnbind + """)("idx", idx0))})
        }
      """
    )
  
    // @LINE:11
    def regularSwap: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.regularSwap",
      """
        function(idx0) {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/swap/" + encodeURIComponent((""" + implicitly[play.api.mvc.PathBindable[Int]].javascriptUnbind + """)("idx", idx0))})
        }
      """
    )
  
    // @LINE:4
    def command: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.command",
      """
        function() {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/command"})
        }
      """
    )
  
    // @LINE:6
    def newGameAI: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.newGameAI",
      """
        function() {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/new-ai"})
        }
      """
    )
  
    // @LINE:22
    def loadSelect: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.loadSelect",
      """
        function(idx0) {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/load/" + encodeURIComponent((""" + implicitly[play.api.mvc.PathBindable[Int]].javascriptUnbind + """)("idx", idx0))})
        }
      """
    )
  
    // @LINE:5
    def newGame: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.newGame",
      """
        function() {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/new"})
        }
      """
    )
  
    // @LINE:21
    def showSaves: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.showSaves",
      """
        function() {
          return _wA({method:"GET", url:"""" + _prefix + { _defaultPrefix } + """" + "api/saves"})
        }
      """
    )
  
    // @LINE:14
    def boostDefender: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.boostDefender",
      """
        function(idx0) {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/boost/defender/" + encodeURIComponent((""" + implicitly[play.api.mvc.PathBindable[Int]].javascriptUnbind + """)("idx", idx0))})
        }
      """
    )
  
    // @LINE:15
    def boostGoalkeeper: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.boostGoalkeeper",
      """
        function() {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/boost/goalkeeper"})
        }
      """
    )
  
    // @LINE:19
    def save: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.save",
      """
        function() {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/save"})
        }
      """
    )
  
    // @LINE:3
    def stream: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.stream",
      """
        function() {
          return _wA({method:"GET", url:"""" + _prefix + { _defaultPrefix } + """" + "api/stream"})
        }
      """
    )
  
    // @LINE:9
    def doubleAttack: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.GameApiController.doubleAttack",
      """
        function(idx0) {
          return _wA({method:"POST", url:"""" + _prefix + { _defaultPrefix } + """" + "api/double-attack/" + encodeURIComponent((""" + implicitly[play.api.mvc.PathBindable[Int]].javascriptUnbind + """)("idx", idx0))})
        }
      """
    )
  
  }

  // @LINE:24
  class ReverseAssets(_prefix: => String) {

    def _defaultPrefix: String = {
      if (_prefix.endsWith("/")) "" else "/"
    }

  
    // @LINE:24
    def versioned: JavaScriptReverseRoute = JavaScriptReverseRoute(
      "controllers.Assets.versioned",
      """
        function(file1) {
          return _wA({method:"GET", url:"""" + _prefix + { _defaultPrefix } + """" + "assets/" + (""" + implicitly[play.api.mvc.PathBindable[Asset]].javascriptUnbind + """)("file", file1)})
        }
      """
    )
  
  }


}
