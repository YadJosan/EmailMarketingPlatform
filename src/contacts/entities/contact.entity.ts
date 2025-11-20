import { Entity, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Audience } from './audience.entity';

export enum ContactStatus {
  SUBSCRIBED = 'subscribed',
  UNSUBSCRIBED = 'unsubscribed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
}

export enum ContactSource {
  IMPORT = 'import',
  FORM = 'form',
  API = 'api',
  MANUAL = 'manual',
}

@Entity('contacts')
export class Contact extends BaseEntity {
  @ManyToOne(() => Workspace)
  workspace: Workspace;

  @Column()
  workspaceId: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ type: 'jsonb', default: {} })
  customFields: Record<string, any>;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'enum', enum: ContactStatus, default: ContactStatus.SUBSCRIBED })
  status: ContactStatus;

  @Column({ type: 'enum', enum: ContactSource })
  source: ContactSource;

  @Column({ type: 'timestamp', nullable: true })
  subscribedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  unsubscribedAt: Date;

  @ManyToMany(() => Audience, audience => audience.contacts)
  @JoinTable({
    name: 'audience_contacts',
    joinColumn: { name: 'contactId' },
    inverseJoinColumn: { name: 'audienceId' },
  })
  audiences: Audience[];
}
