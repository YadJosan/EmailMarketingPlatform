import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailEvent, EmailEventType } from './entities/email-event.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(EmailEvent)
    private eventRepo: Repository<EmailEvent>,
  ) {}

  async trackEvent(campaignEmailId: string, eventType: EmailEventType, metadata?: any) {
    const event = this.eventRepo.create({
      campaignEmailId,
      eventType,
      metadata,
    });
    return this.eventRepo.save(event);
  }

  async getCampaignStats(campaignId: string) {
    const events = await this.eventRepo
      .createQueryBuilder('event')
      .innerJoin('event.campaignEmail', 'email')
      .where('email.campaignId = :campaignId', { campaignId })
      .getMany();

    const stats = {
      sent: events.filter(e => e.eventType === EmailEventType.SENT).length,
      delivered: events.filter(e => e.eventType === EmailEventType.DELIVERED).length,
      opened: events.filter(e => e.eventType === EmailEventType.OPENED).length,
      clicked: events.filter(e => e.eventType === EmailEventType.CLICKED).length,
      bounced: events.filter(e => e.eventType === EmailEventType.BOUNCED).length,
    };

    return {
      ...stats,
      openRate: stats.delivered ? stats.opened / stats.delivered : 0,
      clickRate: stats.delivered ? stats.clicked / stats.delivered : 0,
    };
  }
}
