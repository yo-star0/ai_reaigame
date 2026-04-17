import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentAuth } from '../auth/current-user.decorator';
import { AuthContext, FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './send-message.dto';

@Controller('characters/:id/messages')
@UseGuards(FirebaseAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(
    @Param('id') id: string,
    @CurrentAuth() auth: AuthContext,
    @Query('cursor') cursor?: string,
  ) {
    return this.chat.listMessages(id, auth.firebaseUid, auth.email, cursor);
  }

  @Post()
  send(
    @Param('id') id: string,
    @CurrentAuth() auth: AuthContext,
    @Body() body: SendMessageDto,
  ) {
    return this.chat.sendMessage(id, auth.firebaseUid, auth.email, body.content);
  }
}
