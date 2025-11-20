import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact, ContactStatus } from '../contacts/entities/contact.entity';
import { CampaignEmail, EmailStatus } from '../campaigns/entities/campaign-email.entity';
import { EmailEvent, EmailEventType } from '../analytics/entities/email-event.entity';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    @InjectRepository(CampaignEmail)
    private campaignEmailRepo: Repository<CampaignEmail>,
    @InjectRepository(EmailEvent)
    private eventRepo: Repository<EmailEvent>,
  ) {}

  async confirmSubscription(subscribeUrl: string) {
    // In production, you'd make an HTTP GET request to subscribeUrl
    console.log('SNS Subscription confirmation:', subscribeUrl);
  }

  async handleSesNotification(message: any) {
    const notificationType = message.notificationType;
    const mail = message.mail;

    switch (notificationType) {
      case 'Bounce':
        await this.handleBounce(message.bounce, mail);
        break;
      case 'Complaint':
        await this.handleComplaint(message.complaint, mail);
        break;
      case 'Delivery':
        await this.handleDelivery(mail);
        break;
      default:
        console.log('Unknown notification type:', notificationType);
    }
  }

  private async handleBounce(bounce: any, mail: any) {
    for (const recipient of bounce.bouncedRecipients) {
      const email = recipient.emailAddress;

      // Update contact status
      await this.contactRepo.update(
        { email },
        { status: ContactStatus.BOUNCED },
      );

      // Find campaign email and update
      const campaignEmail = await this.findCampaignEmailByRecipient(email, mail);
      if (campaignEmail) {
        campaignEmail.status = EmailStatus.BOUNCED;
        await this.campaignEmailRepo.save(campaignEmail);

        // Log event
        await this.eventRepo.save({
          campaignEmailId: campaignEmail.id,
          eventType: EmailEventType.BOUNCED,
          metadata: {
            bounceType: bounce.bounceType,
            bounceSubType: bounce.bounceSubType,
            diagnosticCode: recipient.diagnosticCode,
          },
        });
      }
    }
  }

  private async handleComplaint(complaint: any, mail: any) {
    for (const recipient of complaint.complainedRecipients) {
      const email = recipient.emailAddress;

      // Update contact status
      await this.contactRepo.update(
        { email },
        { status: ContactStatus.COMPLAINED },
      );

      // Find campaign email and update
      const campaignEmail = await this.findCampaignEmailByRecipient(email, mail);
      if (campaignEmail) {
        campaignEmail.status = EmailStatus.COMPLAINED;
        await this.campaignEmailRepo.save(campaignEmail);

        // Log event
        await this.eventRepo.save({
          campaignEmailId: campaignEmail.id,
          eventType: EmailEventType.COMPLAINED,
          metadata: {
            complaintFeedbackType: complaint.complaintFeedbackType,
          },
        });
      }
    }
  }

  private async handleDelivery(mail: any) {
    for (const recipient of mail.destination) {
      const campaignEmail = await this.findCampaignEmailByRecipient(recipient, mail);
      if (campaignEmail) {
        campaignEmail.status = EmailStatus.DELIVERED;
        campaignEmail.deliveredAt = new Date();
        await this.campaignEmailRepo.save(campaignEmail);

        // Log event
        await this.eventRepo.save({
          campaignEmailId: campaignEmail.id,
          eventType: EmailEventType.DELIVERED,
        });
      }
    }
  }

  private async findCampaignEmailByRecipient(email: string, mail: any) {
    // You'd need to store message ID in CampaignEmail to match properly
    // For now, find by email and recent timestamp
    const contact = await this.contactRepo.findOne({ where: { email } });
    if (!contact) return null;

    return this.campaignEmailRepo.findOne({
      where: { contactId: contact.id },
      order: { createdAt: 'DESC' },
    });
  }
}
