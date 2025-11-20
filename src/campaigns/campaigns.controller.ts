import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignsService } from './campaigns.service';
import { CampaignStatus } from './entities/campaign.entity';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Post()
  create(
    @Body()
    body: {
      workspaceId: string;
      name: string;
      subject: string;
      previewText?: string;
      fromName: string;
      fromEmail: string;
      replyTo: string;
      content: any;
      audienceId?: string;
      segmentId?: string;
      templateId?: string;
    },
  ) {
    return this.campaignsService.create(body.workspaceId, body);
  }

  @Get(':workspaceId')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.campaignsService.findByWorkspace(workspaceId);
  }

  @Put(':workspaceId/:id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      subject?: string;
      previewText?: string;
      fromName?: string;
      fromEmail?: string;
      replyTo?: string;
      content?: any;
      audienceId?: string;
      segmentId?: string;
    },
  ) {
    return this.campaignsService.update(id, workspaceId, body);
  }

  @Delete(':workspaceId/:id')
  delete(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.delete(id, workspaceId);
  }

  @Post(':workspaceId/:id/send')
  send(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.send(id, workspaceId);
  }

  @Post(':workspaceId/:id/schedule')
  schedule(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body('scheduledAt') scheduledAt: Date,
  ) {
    return this.campaignsService.schedule(id, workspaceId, scheduledAt);
  }

  @Post(':workspaceId/:id/pause')
  pause(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.updateStatus(id, workspaceId, CampaignStatus.PAUSED);
  }

  @Post(':workspaceId/:id/resume')
  resume(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.updateStatus(id, workspaceId, CampaignStatus.SCHEDULED);
  }

  @Get(':workspaceId/:id/preview')
  preview(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body('contactId') contactId?: string,
  ) {
    return this.campaignsService.previewEmail(id, workspaceId, contactId);
  }

  @Get(':workspaceId/:id/recipients/count')
  getRecipientCount(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.getRecipientCount(id, workspaceId);
  }

  @Get(':workspaceId/:id/stats')
  getStats(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.getCampaignStats(id, workspaceId);
  }

  @Get(':workspaceId/:id/recipients')
  getRecipients(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.getCampaignRecipients(id, workspaceId);
  }

  @Get(':workspaceId/:id/recipients/:contactId')
  getRecipientDetails(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Param('contactId') contactId: string,
  ) {
    return this.campaignsService.getRecipientDetails(id, workspaceId, contactId);
  }

  @Post(':workspaceId/:id/retry-failed')
  retryFailed(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.retryFailedEmails(id, workspaceId);
  }

  @Post(':workspaceId/:id/recipients/:contactId/retry')
  retryRecipient(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Param('contactId') contactId: string,
  ) {
    return this.campaignsService.retryRecipient(id, workspaceId, contactId);
  }

  @Get(':workspaceId/:id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.campaignsService.findOne(id, workspaceId);
  }
}
