const Router = require("vertx-web-js/router");
const StaticHandler = require("vertx-web-js/static_handler");

const app = Router.router(vertx);

app.get("/").handler((ctx) => {
  ctx.response()
    .putHeader("content-type", "text/html")
    .end(`<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Example</title>
            <script src="/bundle.js"></script>
          </head>
          <body>
          </body>
          </html>`);
});

app.get().handler(StaticHandler.create().handle);

vertx.createHttpServer().requestHandler(app.accept).listen(8080);

console.log('Server listening: http://127.0.0.1:8080/');
