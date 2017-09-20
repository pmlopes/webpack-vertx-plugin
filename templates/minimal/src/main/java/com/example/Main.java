package com.example;

import io.vertx.core.AbstractVerticle;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;

import xyz.jetdrone.vertx.hot.reload.HotReload;

public class Main extends AbstractVerticle {

  private static final boolean DEBUG = true;

  @Override
  public void start() throws Exception {

    final Router router = Router.router(vertx);
    if (DEBUG) {
      // development hot reload
      router.get().handler(HotReload.create());
    }
    // Serve the static resources
    router.route().handler(DEBUG ? HotReload.createStaticHandler() : StaticHandler.create());

    vertx.createHttpServer().requestHandler(router::accept).listen(8080);
  }
}
