import { Entity, Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Workspace } from './workspace.entity';

export enum MemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('workspace_members')
export class WorkspaceMember {
  @PrimaryColumn()
  workspaceId: string;

  @PrimaryColumn()
  userId: string;

  @ManyToOne(() => Workspace, workspace => workspace.members)
  workspace: Workspace;

  @ManyToOne(() => User, user => user.workspaces)
  user: User;

  @Column({ type: 'enum', enum: MemberRole })
  role: MemberRole;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;
}
