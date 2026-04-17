import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../auth/current-user.decorator';
import { AuthContext, FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CharactersService } from './characters.service';

@Controller('characters')
@UseGuards(FirebaseAuthGuard)
export class CharactersController {
  constructor(private readonly characters: CharactersService) {}

  @Get()
  list() {
    return this.characters.list();
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentAuth() auth: AuthContext) {
    return this.characters.detailForUser(id, auth.firebaseUid, auth.email);
  }

  @Post(':id/opening/complete')
  completeOpening(@Param('id') id: string, @CurrentAuth() auth: AuthContext) {
    return this.characters.completeOpening(id, auth.firebaseUid, auth.email);
  }
}
