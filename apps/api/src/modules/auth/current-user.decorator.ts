import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { AUTH_REQUEST_KEY, AuthContext } from './firebase-auth.guard';

export const CurrentAuth = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthContext => {
  const req = ctx.switchToHttp().getRequest<Request & { [AUTH_REQUEST_KEY]?: AuthContext }>();
  const auth = req[AUTH_REQUEST_KEY];
  if (!auth) {
    throw new Error('CurrentAuth used without FirebaseAuthGuard');
  }
  return auth;
});
