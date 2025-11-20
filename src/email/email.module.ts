import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { MailService } from './mail.service';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { Contact } from '../contacts/entities/contact.entity';
import { CampaignEmail } from '../campaigns/entities/campaign-email.entity';
import { EmailEvent } from '../analytics/entities/email-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, CampaignEmail, EmailEvent])],
  providers: [EmailService, MailService, WebhooksService],
  controllers: [WebhooksController],
  exports: [EmailService, MailService],
})
export class EmailModule {}
