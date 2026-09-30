import { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  function respond(code: string): number {
    const status = jest.fn().mockReturnValue({ json: jest.fn() });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    const error = new Prisma.PrismaClientKnownRequestError('failed', {
      code,
      clientVersion: 'test',
    });

    new PrismaExceptionFilter().catch(error, host);
    return status.mock.calls[0][0];
  }

  it('maps unique violations to 409', () => {
    expect(respond('P2002')).toBe(409);
  });

  it('maps a missing referenced row to 404', () => {
    expect(respond('P2003')).toBe(404);
  });
});
