import { Entity, Column, ManyToOne, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Contact } from './contact.entity';

@Entity('audiences')
export class Audience extends BaseEntity {
  @ManyToOne(() => Workspace, workspace => workspace.audiences)
  workspace: Workspace;

  @Column()
  workspaceId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Contact, contact => contact.audiences)
  contacts: Contact[];
}
