import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { LlmModule } from '../llm/llm.module';
import { RagModule } from '../rag/rag.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [UsersModule, LlmModule, RagModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
