import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception.code === 'P2002') {
      const error = new ConflictException(
        'The requested change conflicts with existing data',
      );
      response.status(error.getStatus()).json(error.getResponse());
      return;
    }

    // P2003: a foreign key points to a missing row, e.g. commenting on a deleted article.
    if (exception.code === 'P2025' || exception.code === 'P2003') {
      const error = new NotFoundException(
        'The requested resource does not exist',
      );
      response.status(error.getStatus()).json(error.getResponse());
      return;
    }

    this.logger.error(
      `Unhandled Prisma error ${exception.code}`,
      exception.stack,
    );
    const error = new InternalServerErrorException('Database operation failed');
    response.status(error.getStatus()).json(error.getResponse());
  }
}
