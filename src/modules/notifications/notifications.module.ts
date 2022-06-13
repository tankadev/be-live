import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsEntity } from './notifications.entity';
import { AWSService } from 'src/shared/services/aws.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationsEntity])],
  controllers: [NotificationsController],
  providers: [NotificationsService, AWSService],
  exports: [
    NotificationsService,
    TypeOrmModule
  ]
})
export class NotificationsModule {}
