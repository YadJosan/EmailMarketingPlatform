import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Audience } from '../../contacts/entities/audience.entity';
import { Segment } from '../../contacts/entities/segment.entity';
import { Template } from '../../templates/entities/template.entity';
import { CampaignEmail } from './campaign-email.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  PAUSED = 'paused',
}

@Entity('campaigns')
export class Campaign extends BaseEntity {
  @ManyToOne(() => Workspace, workspace => workspace.campaigns)
  workspace: Workspace;

  @Column()
  workspaceId: string;

  @Column()
  name: string;

  @Column()
  subject: string;

  @Column({ nullable: true })
  previewText: string;

  @Column()
  fromName: string;

  @Column()
  fromEmail: string;

  @Column()
  replyTo: string;

  @ManyToOne(() => Template, { nullable: true })
  template: Template;

  @Column({ nullable: true })
  templateId: string;

  @Column({ type: 'jsonb' })
  content: any;

  @ManyToOne(() => Audience, { nullable: true })
  audience: Audience;

  @Column({ nullable: true })
  audienceId: string;

  @ManyToOne(() => Segment, { nullable: true })
  segment: Segment;

  @Column({ nullable: true })
  segmentId: string;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @OneToMany(() => CampaignEmail, email => email.campaign)
  emails: CampaignEmail[];
}
