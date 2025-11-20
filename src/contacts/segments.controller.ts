import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SegmentsService, FilterRules } from './segments.service';

@Controller('segments')
@UseGuards(JwtAuthGuard)
export class SegmentsController {
  constructor(private segmentsService: SegmentsService) {}

  @Post()
  create(
    @Body()
    body: {
      workspaceId: string;
      name: string;
      audienceId?: string;
      filterRules: FilterRules;
    },
  ) {
    return this.segmentsService.create(body.workspaceId, {
      name: body.name,
      audienceId: body.audienceId,
      filterRules: body.filterRules,
    });
  }

  @Get(':workspaceId')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.segmentsService.findByWorkspace(workspaceId);
  }

  @Get(':workspaceId/:id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.segmentsService.findOne(id, workspaceId);
  }

  @Put(':workspaceId/:id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; filterRules?: FilterRules },
  ) {
    return this.segmentsService.update(id, workspaceId, body);
  }

  @Delete(':workspaceId/:id')
  delete(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.segmentsService.delete(id, workspaceId);
  }

  @Get(':workspaceId/:id/evaluate')
  evaluate(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.segmentsService.evaluateSegment(id, workspaceId);
  }

  @Get(':workspaceId/:id/count')
  getCount(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.segmentsService.getSegmentCount(id, workspaceId);
  }

  @Post(':workspaceId/test')
  testRules(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { filterRules: FilterRules; audienceId?: string },
  ) {
    return this.segmentsService.testFilterRules(workspaceId, body.filterRules, body.audienceId);
  }
}
