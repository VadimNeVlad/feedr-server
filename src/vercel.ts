import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, RequestHandler, Response } from 'express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

let serverPromise: Promise<RequestHandler> | undefined;

async function createServer(): Promise<RequestHandler> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Vercel's edge proxy sets X-Forwarded-For; without this every client shares
  // the proxy IP and the throttler limits all users as one.
  app.set('trust proxy', 1);
  configureApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance() as RequestHandler;
}

export default async function handler(
  request: Request,
  response: Response,
): Promise<void> {
  serverPromise ??= createServer();
  const server = await serverPromise;
  server(request, response, () => undefined);
}
