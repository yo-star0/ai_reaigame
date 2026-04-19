import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ScenarioCreate,
  ScenarioUpdate,
  scenarioCreateSchema,
  scenarioUpdateSchema,
} from '@ai-reaigame/shared';
import { AdminGuard } from '../auth/admin.guard';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ScenariosService } from './scenarios.service';

@Controller('admin/scenarios')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminScenariosController {
  constructor(private readonly scenarios: ScenariosService) {}

  @Get()
  list() {
    return this.scenarios.adminList();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.scenarios.adminGet(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(scenarioCreateSchema)) body: ScenarioCreate) {
    return this.scenarios.adminCreate(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(scenarioUpdateSchema)) body: ScenarioUpdate,
  ) {
    return this.scenarios.adminUpdate(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scenarios.adminDelete(id);
  }
}
