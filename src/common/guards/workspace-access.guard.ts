import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember } from '../../workspaces/entities/workspace-member.entity';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(WorkspaceMember)
    private memberRepo: Repository<WorkspaceMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const workspaceId = request.params.workspaceId || request.body?.workspaceId;

    if (!userId || !workspaceId) {
      throw new ForbiddenException('Missing user or workspace information');
    }

    const member = await this.memberRepo.findOne({
      where: { userId, workspaceId },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    // Attach workspace member info to request for later use
    request.workspaceMember = member;
    return true;
  }
}
