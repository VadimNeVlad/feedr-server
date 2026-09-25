import { Body, Controller, INestApplication, Post } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureApp } from '../src/app.setup';
import { RegisterDto } from '../src/auth/dto/register.dto';

@Controller('validation-probe')
class ValidationProbeController {
  @Post()
  validate(@Body() dto: RegisterDto): RegisterDto {
    return dto;
  }
}

describe('health endpoint (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController, ValidationProbeController],
      providers: [
        {
          provide: PrismaService,
          useValue: { $queryRaw: jest.fn().mockResolvedValue([{ value: 1 }]) },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('rejects request properties not declared by a DTO', async () => {
    await request(app.getHttpServer())
      .post('/api/validation-probe')
      .send({
        email: 'alice@example.com',
        name: 'Alice',
        password: 'secure-password',
        admin: true,
      })
      .expect(400);
  });

  it('serves the generated OpenAPI document', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    expect(response.body.info.title).toBe('Feeds API');
  });
});
