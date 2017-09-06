package com.example;

import io.vertx.core.AbstractVerticle;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;

import xyz.jetdrone.vertx.hot.reload.HotReload;

public class Main extends AbstractVerticle {

  @Override
  public void start() throws Exception {

    final Router router = Router.router(vertx);
    // development hot reload
    router.get().handler(HotReload.create());
    // Serve the static resources
    router.route().handler(StaticHandler.create());

    vertx.createHttpServer().requestHandler(router::accept).listen(8080);
  }
}
