import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';

@Entity('templates')
export class Template extends BaseEntity {
  @ManyToOne(() => Workspace)
  workspace: Workspace;

  @Column()
  workspaceId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'jsonb' })
  content: {
    blocks: Array<{
      type: 'text' | 'image' | 'button' | 'divider' | 'spacer';
      content?: string;
      props?: Record<string, any>;
    }>;
  };
}
