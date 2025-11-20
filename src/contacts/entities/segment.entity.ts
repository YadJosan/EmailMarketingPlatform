import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Audience } from './audience.entity';

@Entity('segments')
export class Segment extends BaseEntity {
  @ManyToOne(() => Workspace)
  workspace: Workspace;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Audience, { nullable: true })
  audience: Audience;

  @Column({ nullable: true })
  audienceId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  filterRules: any;
}
