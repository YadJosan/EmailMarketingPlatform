import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audience } from './entities/audience.entity';

@Controller('audiences')
@UseGuards(JwtAuthGuard)
export class AudiencesController {
  constructor(
    @InjectRepository(Audience)
    private audienceRepo: Repository<Audience>,
  ) {}

  @Post()
  async create(@Body() body: { workspaceId: string; name: string; description?: string }) {
    const audience = this.audienceRepo.create(body);
    return this.audienceRepo.save(audience);
  }

  @Get(':workspaceId')
  async findAll(@Param('workspaceId') workspaceId: string) {
    return this.audienceRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  @Get(':workspaceId/:id')
  async findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.audienceRepo.findOne({
      where: { id, workspaceId },
    });
  }

  @Put(':workspaceId/:id')
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
  ) {
    await this.audienceRepo.update({ id, workspaceId }, body);
    return this.audienceRepo.findOne({ where: { id, workspaceId } });
  }

  @Delete(':workspaceId/:id')
  async delete(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    await this.audienceRepo.delete({ id, workspaceId });
    return { message: 'Audience deleted successfully' };
  }
}
