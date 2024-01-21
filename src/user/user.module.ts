import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { avatarStorage } from 'src/config/multer.config';

@Module({
  imports: [PrismaModule, MulterModule.register({ storage: avatarStorage })],
  controllers: [UserController],
  providers: [UserService, JwtGuard],
})
export class UserModule {}
