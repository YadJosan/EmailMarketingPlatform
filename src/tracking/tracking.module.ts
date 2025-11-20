import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { CampaignEmail } from '../campaigns/entities/campaign-email.entity';
import { EmailEvent } from '../analytics/entities/email-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CampaignEmail, EmailEvent])],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
