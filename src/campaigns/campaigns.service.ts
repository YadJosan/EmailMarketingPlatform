import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { CampaignEmail, EmailStatus } from './entities/campaign-email.entity';
import { SegmentsService } from '../contacts/segments.service';
import { Contact } from '../contacts/entities/contact.entity';

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
      const html = this.renderEmail(campaign.content, contact);

      // Enqueue email job
      await this.emailQueue.add('send', {
        campaignEmailId: campaignEmail.id,
        to: contact.email,
        from: campaign.fromEmail,
        fromName: campaign.fromName,
        subject,
        html,
        replyTo: campaign.replyTo,
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
}
