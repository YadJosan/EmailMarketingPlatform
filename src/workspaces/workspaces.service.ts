import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember, MemberRole } from './entities/workspace-member.entity';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private memberRepo: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(name: string, slug: string, ownerId: string) {
    const workspace = this.workspaceRepo.create({ name, slug, ownerId });
    await this.workspaceRepo.save(workspace);

    const member = this.memberRepo.create({
      workspaceId: workspace.id,
      userId: ownerId,
      role: MemberRole.OWNER,
    });
    await this.memberRepo.save(member);

    return workspace;
  }

  async findByUser(userId: string) {
    return this.memberRepo.find({
      where: { userId },
      relations: ['workspace'],
    });
  }

  async findOne(workspaceId: string, userId: string) {
    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId },
      relations: ['workspace'],
    });

    if (!member) {
      throw new NotFoundException('Workspace not found');
    }

    return member.workspace;
  }

  async getMembers(workspaceId: string, userId: string) {
    await this.checkMembership(workspaceId, userId);

    return this.memberRepo.find({
      where: { workspaceId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async inviteMember(workspaceId: string, email: string, role: MemberRole, inviterId: string) {
    // Check if inviter has permission (owner or admin)
    await this.checkPermission(workspaceId, inviterId, [MemberRole.OWNER, MemberRole.ADMIN]);

    // Find user by email
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.memberRepo.findOne({
      where: { workspaceId, userId: user.id },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member');
    }

    // Cannot invite as owner
    if (role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot invite as owner');
    }

    const member = this.memberRepo.create({
      workspaceId,
      userId: user.id,
      role,
    });

    return this.memberRepo.save(member);
  }

  async updateMemberRole(workspaceId: string, memberId: string, newRole: MemberRole, updaterId: string) {
    // Only owner can change roles
    await this.checkPermission(workspaceId, updaterId, [MemberRole.OWNER]);

    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner role
    if (member.role === MemberRole.OWNER || newRole === MemberRole.OWNER) {
      throw new BadRequestException('Cannot change owner role');
    }

    member.role = newRole;
    return this.memberRepo.save(member);
  }

  async removeMember(workspaceId: string, memberId: string, removerId: string) {
    // Check if remover has permission
    await this.checkPermission(workspaceId, removerId, [MemberRole.OWNER, MemberRole.ADMIN]);

    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId: memberId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove owner
    if (member.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot remove workspace owner');
    }

    // Admins cannot remove other admins
    const remover = await this.memberRepo.findOne({
      where: { workspaceId, userId: removerId },
    });

    if (remover.role === MemberRole.ADMIN && member.role === MemberRole.ADMIN) {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    await this.memberRepo.remove(member);
    return { message: 'Member removed successfully' };
  }

  async leaveWorkspace(workspaceId: string, userId: string) {
    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Owner cannot leave
    if (member.role === MemberRole.OWNER) {
      throw new BadRequestException('Owner cannot leave workspace. Transfer ownership first.');
    }

    await this.memberRepo.remove(member);
    return { message: 'Left workspace successfully' };
  }

  async transferOwnership(workspaceId: string, newOwnerId: string, currentOwnerId: string) {
    // Only current owner can transfer
    await this.checkPermission(workspaceId, currentOwnerId, [MemberRole.OWNER]);

    const newOwner = await this.memberRepo.findOne({
      where: { workspaceId, userId: newOwnerId },
    });

    if (!newOwner) {
      throw new NotFoundException('New owner must be a member of the workspace');
    }

    const currentOwner = await this.memberRepo.findOne({
      where: { workspaceId, userId: currentOwnerId },
    });

    // Update roles
    currentOwner.role = MemberRole.ADMIN;
    newOwner.role = MemberRole.OWNER;

    // Update workspace owner
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    workspace.ownerId = newOwnerId;

    await this.memberRepo.save([currentOwner, newOwner]);
    await this.workspaceRepo.save(workspace);

    return { message: 'Ownership transferred successfully' };
  }

  private async checkMembership(workspaceId: string, userId: string) {
    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    return member;
  }

  private async checkPermission(workspaceId: string, userId: string, allowedRoles: MemberRole[]) {
    const member = await this.checkMembership(workspaceId, userId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return member;
  }
}
