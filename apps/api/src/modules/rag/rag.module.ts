import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { SummaryService } from './summary.service';

@Module({
  imports: [LlmModule],
  providers: [SummaryService],
  exports: [SummaryService],
})
export class RagModule {}
