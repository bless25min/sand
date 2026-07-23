import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (context) =>
  context.json({
    service: 'worker-api',
    status: 'ok',
  }),
);

export default app;
