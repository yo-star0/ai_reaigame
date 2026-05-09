import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLM_PROVIDER, LlmProvider } from './llm.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';
import { BedrockProvider } from './bedrock.provider';
import { StubProvider } from './stub.provider';

import { OllamaProvider } from './ollama.provider';
import { GroqProvider } from './groq.provider';

function resolveProvider(config: ConfigService): LlmProvider {
  const logger = new Logger('LlmModule');
  const requested = (config.get<string>('LLM_PROVIDER') ?? '').toLowerCase();

  const tryAnthropic = () => {
    if (!config.get<string>('ANTHROPIC_API_KEY')) return null;
    logger.log('Using AnthropicProvider');
    return new AnthropicProvider(config);
  };
  const tryGemini = () => {
    if (!config.get<string>('GOOGLE_API_KEY')) return null;
    logger.log('Using GeminiProvider');
    return new GeminiProvider(config);
  };
  const tryBedrock = () => {
    if (!config.get<string>('AWS_ACCESS_KEY_ID') || !config.get<string>('AWS_SECRET_ACCESS_KEY')) return null;
    logger.log('Using BedrockProvider');
    return new BedrockProvider(config);
  };
  const tryGroq = () => {
    if (!config.get<string>('GROQ_API_KEY')) return null;
    logger.log('Using GroqProvider');
    return new GroqProvider(config);
  };
  const tryOllama = () => {
    logger.log('Using OllamaProvider');
    return new OllamaProvider(config);
  };
  const useStub = () => {
    logger.warn('Using StubProvider (no API key found)');
    return new StubProvider();
  };

  if (requested === 'stub') return useStub();
  if (requested === 'ollama') return tryOllama();
  if (requested === 'anthropic') return tryAnthropic() ?? useStub();
  if (requested === 'gemini') return tryGemini() ?? useStub();
  if (requested === 'bedrock') return tryBedrock() ?? useStub();
  if (requested === 'groq') return tryGroq() ?? useStub();

  return tryGroq() ?? tryAnthropic() ?? tryGemini() ?? tryBedrock() ?? tryOllama() ?? useStub();
}

@Global()
@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: resolveProvider,
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
