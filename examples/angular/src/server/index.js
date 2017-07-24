var Router = require("vertx-web-js/router");
var StaticHandler = require("vertx-web-js/static_handler");

var app = Router.router(vertx);

app.get().handler(StaticHandler.create().handle);

vertx.createHttpServer().requestHandler(app.accept).listen(8080);

console.log('Server listening: http://127.0.0.1:8080/');