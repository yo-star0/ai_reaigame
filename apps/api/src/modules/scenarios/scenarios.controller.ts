import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ScenarioCompleteRequest,
  scenarioCompleteRequestSchema,
} from '@ai-reaigame/shared';
import { CurrentAuth } from '../auth/current-user.decorator';
import { AuthContext, FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ScenariosService } from './scenarios.service';

@Controller()
@UseGuards(FirebaseAuthGuard)
export class ScenariosController {
  constructor(private readonly scenarios: ScenariosService) {}

  @Get('characters/:id/scenarios')
  listForCharacter(@Param('id') id: string, @CurrentAuth() auth: AuthContext) {
    return this.scenarios.listForPlayer(id, auth.firebaseUid, auth.email);
  }

  @Get('scenarios/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.scenarios.getBySlug(slug);
  }

  @Post('scenarios/:slug/complete')
  complete(
    @Param('slug') slug: string,
    @CurrentAuth() auth: AuthContext,
    @Body(new ZodValidationPipe(scenarioCompleteRequestSchema)) body: ScenarioCompleteRequest,
  ) {
    return this.scenarios.completeScenario(
      slug,
      auth.firebaseUid,
      auth.email,
      body.lastSceneKey,
      body.totalAffinityDelta,
    );
  }
}
