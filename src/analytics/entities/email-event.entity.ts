import { Entity, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { CampaignEmail } from '../../campaigns/entities/campaign-email.entity';

export enum EmailEventType {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed',
}

@Entity('email_events')
export class EmailEvent {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id: string;

  @ManyToOne(() => CampaignEmail, email => email.events)
  campaignEmail: CampaignEmail;

  @Column()
  campaignEmailId: string;

  @Column({ type: 'enum', enum: EmailEventType })
  eventType: EmailEventType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
