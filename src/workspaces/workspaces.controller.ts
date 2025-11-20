import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import { MemberRole } from './entities/workspace-member.entity';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() body: { name: string; slug: string }, @Request() req) {
    return this.workspacesService.create(body.name, body.slug, req.user.userId);
  }

  @Get()
  findAll(@Request() req) {
    return this.workspacesService.findByUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.workspacesService.findOne(id, req.user.userId);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string, @Request() req) {
    return this.workspacesService.getMembers(id, req.user.userId);
  }

  @Post(':id/members')
  inviteMember(
    @Param('id') id: string,
    @Body() body: { email: string; role: MemberRole },
    @Request() req,
  ) {
    return this.workspacesService.inviteMember(id, body.email, body.role, req.user.userId);
  }

  @Put(':id/members/:memberId/role')
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: MemberRole },
    @Request() req,
  ) {
    return this.workspacesService.updateMemberRole(id, memberId, body.role, req.user.userId);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req,
  ) {
    return this.workspacesService.removeMember(id, memberId, req.user.userId);
  }

  @Post(':id/leave')
  leaveWorkspace(@Param('id') id: string, @Request() req) {
    return this.workspacesService.leaveWorkspace(id, req.user.userId);
  }

  @Post(':id/transfer-ownership')
  transferOwnership(
    @Param('id') id: string,
    @Body() body: { newOwnerId: string },
    @Request() req,
  ) {
    return this.workspacesService.transferOwnership(id, body.newOwnerId, req.user.userId);
  }
}
