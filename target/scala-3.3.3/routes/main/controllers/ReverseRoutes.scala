// @GENERATOR:play-routes-compiler
// @SOURCE:conf/routes

import play.api.mvc.Call


import _root_.controllers.Assets.Asset

// @LINE:1
package controllers {

  // @LINE:1
  class ReverseUiController(_prefix: => String) {
    def _defaultPrefix: String = {
      if (_prefix.endsWith("/")) "" else "/"
    }

  
    // @LINE:1
    def index: Call = {
      
      Call("GET", _prefix)
    }
  
  }

  // @LINE:2
  class ReverseGameApiController(_prefix: => String) {
    def _defaultPrefix: String = {
      if (_prefix.endsWith("/")) "" else "/"
    }

  
    // @LINE:12
    def reverseSwap(): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/reverse-swap")
    }
  
    // @LINE:17
    def undo(): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/undo")
    }
  
    // @LINE:2
    def state: Call = {
      
      Call("GET", _prefix + { _defaultPrefix } + "api/state")
    }
  
    // @LINE:18
    def redo(): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/redo")
    }
  
    // @LINE:8
    def attack(idx:Int): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/attack/" + play.core.routing.dynamicString(implicitly[play.api.mvc.PathBindable[Int]].unbind("idx", idx)))
    }
  
    // @LINE:11
    def regularSwap(idx:Int): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/swap/" + play.core.routing.dynamicString(implicitly[play.api.mvc.PathBindable[Int]].unbind("idx", idx)))
    }
  
    // @LINE:4
    def command: Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/command")
    }
  
    // @LINE:6
    def newGameAI: Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/new-ai")
    }
  
    // @LINE:22
    def loadSelect(idx:Int): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/load/" + play.core.routing.dynamicString(implicitly[play.api.mvc.PathBindable[Int]].unbind("idx", idx)))
    }
  
    // @LINE:5
    def newGame: Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/new")
    }
  
    // @LINE:21
    def showSaves(): Call = {
      
      Call("GET", _prefix + { _defaultPrefix } + "api/saves")
    }
  
    // @LINE:14
    def boostDefender(idx:Int): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/boost/defender/" + play.core.routing.dynamicString(implicitly[play.api.mvc.PathBindable[Int]].unbind("idx", idx)))
    }
  
    // @LINE:15
    def boostGoalkeeper(): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/boost/goalkeeper")
    }
  
    // @LINE:19
    def save(): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/save")
    }
  
    // @LINE:3
    def stream: Call = {
      
      Call("GET", _prefix + { _defaultPrefix } + "api/stream")
    }
  
    // @LINE:9
    def doubleAttack(idx:Int): Call = {
      
      Call("POST", _prefix + { _defaultPrefix } + "api/double-attack/" + play.core.routing.dynamicString(implicitly[play.api.mvc.PathBindable[Int]].unbind("idx", idx)))
    }
  
  }


}
