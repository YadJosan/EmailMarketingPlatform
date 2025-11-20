import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Campaign } from './campaign.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { EmailEvent } from '../../analytics/entities/email-event.entity';

export enum EmailStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
}

@Entity('campaign_emails')
export class CampaignEmail extends BaseEntity {
  @ManyToOne(() => Campaign, campaign => campaign.emails)
  campaign: Campaign;

  @Column()
  campaignId: string;

  @ManyToOne(() => Contact)
  contact: Contact;

  @Column()
  contactId: string;

  @Column({ type: 'enum', enum: EmailStatus, default: EmailStatus.PENDING })
  status: EmailStatus;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ default: 0 })
  openCount: number;

  @Column({ default: 0 })
  clickCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastOpenedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastClickedAt: Date;

  @Column({ nullable: true })
  messageId: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @OneToMany(() => EmailEvent, event => event.campaignEmail)
  events: EmailEvent[];
}
