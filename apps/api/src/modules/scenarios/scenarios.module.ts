import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AdminScenariosController } from './admin-scenarios.controller';
import { ScenariosController } from './scenarios.controller';
import { ScenariosService } from './scenarios.service';

@Module({
  imports: [UsersModule],
  controllers: [ScenariosController, AdminScenariosController],
  providers: [ScenariosService],
  exports: [ScenariosService],
})
export class ScenariosModule {}
