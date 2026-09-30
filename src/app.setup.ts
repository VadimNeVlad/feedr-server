import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { requestLogging } from './common/middleware/request-logging.middleware';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.use(requestLogging);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const allowedOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? ['http://localhost:3000', 'http://localhost:5173'];
  app.enableCors({ origin: allowedOrigins, credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Feeds API')
    .setDescription(
      'Articles, profiles, comments, tags, follows, and reading lists',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    { useGlobalPrefix: true },
  );
}
