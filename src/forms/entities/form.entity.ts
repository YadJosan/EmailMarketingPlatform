import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Audience } from '../../contacts/entities/audience.entity';

@Entity('forms')
export class Form extends BaseEntity {
  @ManyToOne(() => Workspace)
  workspace: Workspace;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Audience)
  audience: Audience;

  @Column()
  audienceId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
  }>;

  @Column({ default: false })
  doubleOptIn: boolean;

  @Column({ default: 'Thank you for subscribing!' })
  successMessage: string;
}
