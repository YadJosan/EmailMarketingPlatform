import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Campaign } from './entities/campaign.entity';
import { CampaignEmail } from './entities/campaign-email.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { EmailSendProcessor } from './processors/email-send.processor';
import { EmailModule } from '../email/email.module';
import { ContactsModule } from '../contacts/contacts.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, CampaignEmail, Contact]),
    BullModule.registerQueue({ name: 'email-send' }),
    EmailModule,
    ContactsModule,
    TrackingModule,
  ],
  providers: [CampaignsService, EmailSendProcessor],
  controllers: [CampaignsController],
  exports: [CampaignsService],
})
export class CampaignsModule {}
