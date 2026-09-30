import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Number of reverse proxies in front of the app (e.g. 1 behind the nginx
  // gateway), so req.ip and the throttler see the real client address.
  if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY));
  }
  configureApp(app);
  app.enableShutdownHooks();
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
