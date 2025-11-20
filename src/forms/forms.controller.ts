import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FormsService } from './forms.service';

@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) {
    return this.formsService.create(body.workspaceId, body);
  }

  @Get(':workspaceId')
  @UseGuards(JwtAuthGuard)
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.formsService.findByWorkspace(workspaceId);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Body() body: any) {
    // Public endpoint for form submissions
    // TODO: Create contact, handle double opt-in
    return { success: true, message: 'Thank you for subscribing!' };
  }
}
