import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

const logger = new Logger('HTTP');

// Registered as plain middleware (not an interceptor) so requests rejected by
// guards (401, 429) and unknown routes (404) are logged and get a request id too.
export function requestLogging(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const suppliedRequestId = request.header('x-request-id');
  const requestId =
    suppliedRequestId && suppliedRequestId.length <= 128
      ? suppliedRequestId
      : randomUUID();
  const startedAt = Date.now();

  response.setHeader('x-request-id', requestId);

  response.once('finish', () => {
    logger.log(
      JSON.stringify({
        requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
      }),
    );
  });
  next();
}
