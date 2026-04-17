import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../auth/current-user.decorator';
import { AuthContext, FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { UsersService } from './users.service';

@Controller('me')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async getMe(@CurrentAuth() auth: AuthContext) {
    const user = await this.users.findOrCreateByFirebaseUid(auth.firebaseUid, auth.email);
    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      displayName: user.displayName,
    };
  }
}
