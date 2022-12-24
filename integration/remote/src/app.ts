import Koa from "koa";
import Router from "@koa/router";
import logger from 'koa-logger';

const app = new Koa();
app.use(logger());

const router = new Router();

router.get('/', (ctx) => {
  ctx.body = { ok: true }
});

router.get('/people', (ctx) => {
  ctx.status = 200;
  ctx.body = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Doe" }
  ]
});

router.post('/people', (ctx) => {
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

