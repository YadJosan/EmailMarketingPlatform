import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import { WorkspaceMember } from './workspace-member.entity';
import { Audience } from '../../contacts/entities/audience.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';

export enum WorkspacePlan {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Entity('workspaces')
export class Workspace extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @ManyToOne(() => User)
  owner: User;

  @Column()
  ownerId: string;

  @Column({ type: 'enum', enum: WorkspacePlan, default: WorkspacePlan.FREE })
  plan: WorkspacePlan;

  @OneToMany(() => WorkspaceMember, member => member.workspace)
  members: WorkspaceMember[];

  @OneToMany(() => Audience, audience => audience.workspace)
  audiences: Audience[];

  @OneToMany(() => Campaign, campaign => campaign.workspace)
  campaigns: Campaign[];
}
