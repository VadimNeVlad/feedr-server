import { ExecutionContext, Injectable } from '@nestjs/common';
import { JwtGuard } from './jwt.guard';
@Injectable()
export class OptionalJwtGuard extends JwtGuard {
  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string } }>();
    return request.headers.authorization ? super.canActivate(context) : true;
  }
}
