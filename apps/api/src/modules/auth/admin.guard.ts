import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { AUTH_REQUEST_KEY, AuthContext } from './firebase-auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly users: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { [AUTH_REQUEST_KEY]?: AuthContext }>();
    const auth = req[AUTH_REQUEST_KEY];
    if (!auth) {
      throw new ForbiddenException('Authentication required');
    }
    const user = await this.users.findOrCreateByFirebaseUid(auth.firebaseUid, auth.email);
    if (!user.isAdmin) {
      throw new ForbiddenException('Admin privilege required');
    }
    return true;
  }
}
