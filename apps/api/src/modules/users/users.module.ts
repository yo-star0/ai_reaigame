import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminGuard } from '../auth/admin.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AdminGuard],
  exports: [UsersService, AdminGuard],
})
export class UsersModule {}
