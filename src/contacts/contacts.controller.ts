import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { ContactsImportService } from './contacts-import.service';
import { ContactStatus, ContactSource } from './entities/contact.entity';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(
    private contactsService: ContactsService,
    private importService: ContactsImportService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      workspaceId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      customFields?: Record<string, any>;
      tags?: string[];
      source?: ContactSource;
    },
  ) {
    return this.contactsService.create(body.workspaceId, body);
  }

  @Get(':workspaceId')
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('status') status?: ContactStatus,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
  ) {
    return this.contactsService.findByWorkspace(workspaceId, { status, tag, search });
  }

  @Get(':workspaceId/:id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.contactsService.findOne(id, workspaceId);
  }

  @Put(':workspaceId/:id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body()
    body: {
      email?: string;
      firstName?: string;
      lastName?: string;
      customFields?: Record<string, any>;
      tags?: string[];
      status?: ContactStatus;
    },
  ) {
    return this.contactsService.update(id, workspaceId, body);
  }

  @Delete(':workspaceId/:id')
  delete(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.contactsService.delete(id, workspaceId);
  }

  @Post(':workspaceId/:id/subscribe')
  subscribe(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.contactsService.updateStatus(id, workspaceId, ContactStatus.SUBSCRIBED);
  }

  @Post(':workspaceId/:id/unsubscribe')
  unsubscribe(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.contactsService.updateStatus(id, workspaceId, ContactStatus.UNSUBSCRIBED);
  }

  @Post(':workspaceId/:id/tags')
  addTags(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    return this.contactsService.addTags(id, workspaceId, tags);
  }

  @Delete(':workspaceId/:id/tags')
  removeTags(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body('tags') tags: string[],
  ) {
    return this.contactsService.removeTags(id, workspaceId, tags);
  }

  @Post(':workspaceId/bulk-delete')
  bulkDelete(@Param('workspaceId') workspaceId: string, @Body('ids') ids: string[]) {
    return this.contactsService.bulkDelete(ids, workspaceId);
  }

  @Post(':workspaceId/bulk-tag')
  bulkTag(
    @Param('workspaceId') workspaceId: string,
    @Body('ids') ids: string[],
    @Body('tags') tags: string[],
  ) {
    return this.contactsService.bulkAddTags(ids, workspaceId, tags);
  }

  @Post(':workspaceId/import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Param('workspaceId') workspaceId: string,
    @Body('audienceId') audienceId: string,
    @Body('updateExisting') updateExisting: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.importFromCsv(workspaceId, audienceId, csvContent, {
      updateExisting: updateExisting === 'true',
      skipInvalid: true,
    });
  }

  @Post(':workspaceId/validate-csv')
  @UseInterceptors(FileInterceptor('file'))
  async validateCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const csvContent = file.buffer.toString('utf-8');
    return this.importService.validateCsv(csvContent);
  }

  // Audience endpoints
  @Post(':workspaceId/audiences')
  createAudience(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { name: string; description?: string },
  ) {
    return this.contactsService.createAudience(workspaceId, body.name, body.description);
  }

  @Get(':workspaceId/audiences/list')
  getAudiences(@Param('workspaceId') workspaceId: string) {
    return this.contactsService.findAudiencesByWorkspace(workspaceId);
  }

  @Post(':workspaceId/:contactId/audiences/:audienceId')
  addToAudience(
    @Param('workspaceId') workspaceId: string,
    @Param('contactId') contactId: string,
    @Param('audienceId') audienceId: string,
  ) {
    return this.contactsService.addToAudience(contactId, audienceId, workspaceId);
  }
}
