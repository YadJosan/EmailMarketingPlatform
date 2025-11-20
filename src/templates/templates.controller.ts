import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemplatesService } from './templates.service';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Post()
  create(@Body() body: any) {
    return this.templatesService.create(body.workspaceId, body);
  }

  @Get(':workspaceId')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.templatesService.findByWorkspace(workspaceId);
  }
}
