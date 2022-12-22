import Koa from "koa";
import Router from "@koa/router";

const app = new Koa();

const router = new Router();

router.get('/', (ctx) => {
  ctx.body = { ok: true }
});

router.get('/json', (ctx) => {
  ctx.status = 201;
  ctx.body = { json: "okay" };
});

const port = process.env.PORT || 3000;
app.use(router.routes()).use(router.allowedMethods());
const server = app.listen(port);

console.log(`listening on :${port}`);

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
  process.on(signal, () => {
    server.close();
  });
})

