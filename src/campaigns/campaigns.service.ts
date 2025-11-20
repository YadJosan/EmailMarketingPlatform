import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { CampaignEmail, EmailStatus } from './entities/campaign-email.entity';
import { SegmentsService } from '../contacts/segments.service';
import { Contact } from '../contacts/entities/contact.entity';
import { TrackingService } from '../tracking/tracking.service';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignEmail)
    private campaignEmailRepo: Repository<CampaignEmail>,
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    @InjectQueue('email-send')
    private emailQueue: Queue,
    private segmentsService: SegmentsService,
    private trackingService: TrackingService,
  ) {}

  async create(workspaceId: string, data: Partial<Campaign>) {
    const campaign = this.campaignRepo.create({ ...data, workspaceId });
    return this.campaignRepo.save(campaign);
  }

  async findByWorkspace(workspaceId: string) {
    return this.campaignRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(campaignId: string, workspaceId: string) {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, workspaceId },
      relations: ['template', 'audience'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async update(campaignId: string, workspaceId: string, data: Partial<Campaign>) {
    const campaign = await this.findOne(campaignId, workspaceId);
    Object.assign(campaign, data);
    return this.campaignRepo.save(campaign);
  }

  async delete(campaignId: string, workspaceId: string) {
    const campaign = await this.findOne(campaignId, workspaceId);
    
    // Only allow deleting draft campaigns
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new ForbiddenException('Can only delete draft campaigns');
    }
    
    await this.campaignRepo.remove(campaign);
    return { message: 'Campaign deleted successfully' };
  }

  async schedule(campaignId: string, workspaceId: string, scheduledAt: Date) {
    const campaign = await this.findOne(campaignId, workspaceId);
    
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new ForbiddenException('Can only schedule draft campaigns');
    }
    
    campaign.scheduledAt = scheduledAt;
    campaign.status = CampaignStatus.SCHEDULED;
    
    return this.campaignRepo.save(campaign);
  }

  async updateStatus(campaignId: string, workspaceId: string, status: CampaignStatus) {
    const campaign = await this.findOne(campaignId, workspaceId);
    campaign.status = status;
    return this.campaignRepo.save(campaign);
  }

  async previewEmail(campaignId: string, workspaceId: string, contactId?: string) {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, workspaceId },
      relations: ['audience', 'segment'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Get a sample contact for preview
    let contact;
    if (contactId) {
      contact = await this.campaignEmailRepo
        .createQueryBuilder('ce')
        .leftJoinAndSelect('ce.contact', 'contact')
        .where('contact.id = :contactId', { contactId })
        .andWhere('contact.workspaceId = :workspaceId', { workspaceId })
        .getOne();
      contact = contact?.contact;
    } else {
      // Get first contact from audience/segment
      if (campaign.audienceId) {
        contact = await this.campaignEmailRepo
          .createQueryBuilder('contact')
          .innerJoin('contact.audiences', 'audience')
          .where('audience.id = :audienceId', { audienceId: campaign.audienceId })
          .andWhere('contact.workspaceId = :workspaceId', { workspaceId })
          .limit(1)
          .getOne();
      }
    }

    if (!contact) {
      // Use dummy contact for preview
      contact = {
        email: 'preview@example.com',
        firstName: 'John',
        lastName: 'Doe',
        customFields: {},
      };
    }

    const html = this.renderEmail(campaign.content, contact);

    return {
      subject: this.replaceMergeTags(campaign.subject, contact),
      previewText: campaign.previewText ? this.replaceMergeTags(campaign.previewText, contact) : '',
      fromName: campaign.fromName,
      fromEmail: campaign.fromEmail,
      replyTo: campaign.replyTo,
      html,
      contact: {
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
      },
    };
  }

  async send(campaignId: string, workspaceId: string) {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId, workspaceId },
      relations: ['audience', 'segment'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Verify workspace isolation
    if (campaign.workspaceId !== workspaceId) {
      throw new ForbiddenException('Campaign does not belong to this workspace');
    }

    // Must have either audience or segment
    if (!campaign.audienceId && !campaign.segmentId) {
      throw new BadRequestException('Campaign must target an audience or segment');
    }

    campaign.status = CampaignStatus.SENDING;
    await this.campaignRepo.save(campaign);

    // Get contacts based on targeting
    let contacts: Contact[] = [];

    if (campaign.segmentId) {
      // Use segment (dynamic filtering)
      contacts = await this.segmentsService.evaluateSegment(campaign.segmentId, workspaceId);
    } else if (campaign.audienceId) {
      // Use audience (static list)
      contacts = await this.contactRepo
        .createQueryBuilder('contact')
        .innerJoin('contact.audiences', 'audience')
        .where('audience.id = :audienceId', { audienceId: campaign.audienceId })
        .andWhere('contact.workspaceId = :workspaceId', { workspaceId })
        .andWhere('contact.status = :status', { status: 'subscribed' })
        .getMany();
    }

    // Filter out unsubscribed contacts
    contacts = contacts.filter((c) => c.status === 'subscribed');

    // Create CampaignEmail records and enqueue
    for (const contact of contacts) {
      // Verify contact belongs to same workspace
      if (contact.workspaceId !== workspaceId) {
        continue; // Skip contacts from other workspaces
      }

      const campaignEmail = this.campaignEmailRepo.create({
        campaignId: campaign.id,
        contactId: contact.id,
        status: EmailStatus.PENDING,
      });
      await this.campaignEmailRepo.save(campaignEmail);

      // Replace merge tags in subject and content
      const subject = this.replaceMergeTags(campaign.subject, contact);
      let html = this.renderEmail(campaign.content, contact);
      
      // Add tracking pixel and link tracking
      html = this.trackingService.addTrackingToEmail(html, campaignEmail.id);

      // Enqueue email job with exponential backoff retry
      await this.emailQueue.add('send', {
        campaignEmailId: campaignEmail.id,
        to: contact.email,
        from: campaign.fromEmail,
        fromName: campaign.fromName,
        subject,
        html,
        replyTo: campaign.replyTo,
      }, {
        attempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '5'),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.EMAIL_RETRY_DELAY || '2000'),
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      });
    }

    campaign.status = CampaignStatus.SENT;
    campaign.sentAt = new Date();
    return this.campaignRepo.save(campaign);
  }

  async getRecipientCount(campaignId: string, workspaceId: string): Promise<number> {
    const campaign = await this.findOne(campaignId, workspaceId);

    if (campaign.segmentId) {
      return this.segmentsService.getSegmentCount(campaign.segmentId, workspaceId);
    } else if (campaign.audienceId) {
      const count = await this.contactRepo
        .createQueryBuilder('contact')
        .innerJoin('contact.audiences', 'audience')
        .where('audience.id = :audienceId', { audienceId: campaign.audienceId })
        .andWhere('contact.workspaceId = :workspaceId', { workspaceId })
        .andWhere('contact.status = :status', { status: 'subscribed' })
        .getCount();
      return count;
    }

    return 0;
  }

  private renderEmail(content: any, contact: any): string {
    // Simple template rendering - replace merge tags
    let html = typeof content === 'string' ? content : JSON.stringify(content);
    return this.replaceMergeTags(html, contact);
  }

  private replaceMergeTags(text: string, contact: any): string {
    if (!text) return '';
    
    let result = text;
    
    // Standard merge tags
    result = result.replace(/{{first_name}}/g, contact.firstName || '');
    result = result.replace(/{{last_name}}/g, contact.lastName || '');
    result = result.replace(/{{email}}/g, contact.email || '');
    result = result.replace(/{{full_name}}/g, `${contact.firstName || ''} ${contact.lastName || ''}`.trim());
    
    // Custom field merge tags
    if (contact.customFields) {
      Object.keys(contact.customFields).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, contact.customFields[key] || '');
      });
    }
    
    return result;
  }

  async getCampaignStats(campaignId: string, workspaceId: string) {
    const campaign = await this.findOne(campaignId, workspaceId);

    const stats = await this.campaignEmailRepo
      .createQueryBuilder('ce')
      .select('ce.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(ce.openCount)', 'totalOpens')
      .addSelect('SUM(ce.clickCount)', 'totalClicks')
      .addSelect('COUNT(DISTINCT CASE WHEN ce.openCount > 0 THEN ce.id END)', 'uniqueOpens')
      .addSelect('COUNT(DISTINCT CASE WHEN ce.clickCount > 0 THEN ce.id END)', 'uniqueClicks')
      .where('ce.campaignId = :campaignId', { campaignId })
      .groupBy('ce.status')
      .getRawMany();

    const totals = await this.campaignEmailRepo
      .createQueryBuilder('ce')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(ce.openCount)', 'totalOpens')
      .addSelect('SUM(ce.clickCount)', 'totalClicks')
      .addSelect('COUNT(DISTINCT CASE WHEN ce.openCount > 0 THEN ce.id END)', 'uniqueOpens')
      .addSelect('COUNT(DISTINCT CASE WHEN ce.clickCount > 0 THEN ce.id END)', 'uniqueClicks')
      .where('ce.campaignId = :campaignId', { campaignId })
      .getRawOne();

    const total = parseInt(totals.total) || 0;
    const uniqueOpens = parseInt(totals.uniqueOpens) || 0;
    const uniqueClicks = parseInt(totals.uniqueClicks) || 0;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        sentAt: campaign.sentAt,
      },
      summary: {
        total,
        sent: stats.find((s) => s.status === EmailStatus.SENT)?.count || 0,
        delivered: stats.find((s) => s.status === EmailStatus.DELIVERED)?.count || 0,
        bounced: stats.find((s) => s.status === EmailStatus.BOUNCED)?.count || 0,
        complained: stats.find((s) => s.status === EmailStatus.COMPLAINED)?.count || 0,
        uniqueOpens,
        uniqueClicks,
        totalOpens: parseInt(totals.totalOpens) || 0,
        totalClicks: parseInt(totals.totalClicks) || 0,
        openRate: total > 0 ? ((uniqueOpens / total) * 100).toFixed(2) : '0.00',
        clickRate: total > 0 ? ((uniqueClicks / total) * 100).toFixed(2) : '0.00',
        clickToOpenRate: uniqueOpens > 0 ? ((uniqueClicks / uniqueOpens) * 100).toFixed(2) : '0.00',
      },
      byStatus: stats,
    };
  }

  async getCampaignRecipients(campaignId: string, workspaceId: string) {
    const campaign = await this.findOne(campaignId, workspaceId);

    const recipients = await this.campaignEmailRepo.find({
      where: { campaignId },
      relations: ['contact'],
      order: { sentAt: 'DESC' },
    });

    return recipients.map((r) => ({
      id: r.id,
      contact: {
        id: r.contact.id,
        email: r.contact.email,
        firstName: r.contact.firstName,
        lastName: r.contact.lastName,
      },
      status: r.status,
      sentAt: r.sentAt,
      deliveredAt: r.deliveredAt,
      openCount: r.openCount,
      clickCount: r.clickCount,
      lastOpenedAt: r.lastOpenedAt,
      lastClickedAt: r.lastClickedAt,
    }));
  }

  async getRecipientDetails(campaignId: string, workspaceId: string, contactId: string) {
    const campaign = await this.findOne(campaignId, workspaceId);

    const campaignEmail = await this.campaignEmailRepo.findOne({
      where: { campaignId, contactId },
      relations: ['contact', 'events'],
    });

    if (!campaignEmail) {
      throw new NotFoundException('Recipient not found in this campaign');
    }

    return {
      id: campaignEmail.id,
      contact: {
        id: campaignEmail.contact.id,
        email: campaignEmail.contact.email,
        firstName: campaignEmail.contact.firstName,
        lastName: campaignEmail.contact.lastName,
      },
      status: campaignEmail.status,
      sentAt: campaignEmail.sentAt,
      deliveredAt: campaignEmail.deliveredAt,
      openCount: campaignEmail.openCount,
      clickCount: campaignEmail.clickCount,
      lastOpenedAt: campaignEmail.lastOpenedAt,
      lastClickedAt: campaignEmail.lastClickedAt,
      events: campaignEmail.events.map((e) => ({
        type: e.eventType,
        timestamp: e.createdAt,
        metadata: e.metadata,
      })),
    };
  }


  async retryFailedEmails(campaignId: string, workspaceId: string) {
    const campaign = await this.findOne(campaignId, workspaceId);

    // Get all failed emails
    const failedEmails = await this.campaignEmailRepo.find({
      where: { 
        campaignId, 
        status: EmailStatus.FAILED 
      },
      relations: ['contact'],
    });

    if (failedEmails.length === 0) {
      return { 
        message: 'No failed emails to retry',
        retried: 0 
      };
    }

    let retriedCount = 0;

    for (const campaignEmail of failedEmails) {
      const contact = campaignEmail.contact;

      // Verify contact still belongs to workspace
      if (contact.workspaceId !== workspaceId) {
        continue;
      }

      // Reset status to pending
      campaignEmail.status = EmailStatus.PENDING;
      campaignEmail.error = null;
      await this.campaignEmailRepo.save(campaignEmail);

      // Replace merge tags
      const subject = this.replaceMergeTags(campaign.subject, contact);
      const html = this.renderEmail(campaign.content, contact);

      // Re-enqueue with retry configuration
      await this.emailQueue.add('send', {
        campaignEmailId: campaignEmail.id,
        to: contact.email,
        from: campaign.fromEmail,
        fromName: campaign.fromName,
        subject,
        html,
        replyTo: campaign.replyTo,
      }, {
        attempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '5'),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.EMAIL_RETRY_DELAY || '2000'),
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      });

      retriedCount++;
    }

    return {
      message: `Retrying ${retriedCount} failed emails`,
      retried: retriedCount,
      total: failedEmails.length,
    };
  }

  async retryRecipient(campaignId: string, workspaceId: string, contactId: string) {
    const campaign = await this.findOne(campaignId, workspaceId);

    const campaignEmail = await this.campaignEmailRepo.findOne({
      where: { campaignId, contactId },
      relations: ['contact'],
    });

    if (!campaignEmail) {
      throw new NotFoundException('Recipient not found in this campaign');
    }

    // Verify contact belongs to workspace
    if (campaignEmail.contact.workspaceId !== workspaceId) {
      throw new ForbiddenException('Contact does not belong to this workspace');
    }

    // Reset status
    campaignEmail.status = EmailStatus.PENDING;
    campaignEmail.error = null;
    await this.campaignEmailRepo.save(campaignEmail);

    const contact = campaignEmail.contact;
    const subject = this.replaceMergeTags(campaign.subject, contact);
    const html = this.renderEmail(campaign.content, contact);

    // Re-enqueue
    await this.emailQueue.add('send', {
      campaignEmailId: campaignEmail.id,
      to: contact.email,
      from: campaign.fromEmail,
      fromName: campaign.fromName,
      subject,
      html,
      replyTo: campaign.replyTo,
    }, {
      attempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS || '5'),
      backoff: {
        type: 'exponential',
        delay: parseInt(process.env.EMAIL_RETRY_DELAY || '2000'),
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    return {
      message: 'Email queued for retry',
      campaignEmailId: campaignEmail.id,
      contact: {
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
      },
    };
  }
}
