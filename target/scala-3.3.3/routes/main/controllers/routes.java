// @GENERATOR:play-routes-compiler
// @SOURCE:conf/routes

package controllers;

import router.RoutesPrefix;

public class routes {
  
  public static final controllers.ReverseUiController UiController = new controllers.ReverseUiController(RoutesPrefix.byNamePrefix());
  public static final controllers.ReverseGameApiController GameApiController = new controllers.ReverseGameApiController(RoutesPrefix.byNamePrefix());
  public static final controllers.ReverseAssets Assets = new controllers.ReverseAssets(RoutesPrefix.byNamePrefix());

  public static class javascript {
    
    public static final controllers.javascript.ReverseUiController UiController = new controllers.javascript.ReverseUiController(RoutesPrefix.byNamePrefix());
    public static final controllers.javascript.ReverseGameApiController GameApiController = new controllers.javascript.ReverseGameApiController(RoutesPrefix.byNamePrefix());
    public static final controllers.javascript.ReverseAssets Assets = new controllers.javascript.ReverseAssets(RoutesPrefix.byNamePrefix());
  }

}
