import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLM_PROVIDER, LlmProvider } from './llm.provider';
import { AnthropicProvider } from './anthropic.provider';
import { StubProvider } from './stub.provider';

@Global()
@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): LlmProvider => {
        const provider = config.get<string>('LLM_PROVIDER') ?? 'anthropic';
        if (provider === 'stub' || !config.get<string>('ANTHROPIC_API_KEY')) {
          return new StubProvider();
        }
        if (provider === 'anthropic') {
          return new AnthropicProvider(config);
        }
        throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
      },
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
