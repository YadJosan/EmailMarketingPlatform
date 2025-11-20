import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templateRepo: Repository<Template>,
  ) {}

  async create(workspaceId: string, data: Partial<Template>) {
    const template = this.templateRepo.create({ ...data, workspaceId });
    return this.templateRepo.save(template);
  }

  async findByWorkspace(workspaceId: string) {
    return this.templateRepo.find({ 
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(templateId: string, workspaceId: string) {
    const template = await this.templateRepo.findOne({
      where: { id: templateId, workspaceId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async update(templateId: string, workspaceId: string, data: Partial<Template>) {
    const template = await this.findOne(templateId, workspaceId);
    Object.assign(template, data);
    return this.templateRepo.save(template);
  }

  async delete(templateId: string, workspaceId: string) {
    const template = await this.findOne(templateId, workspaceId);
    await this.templateRepo.remove(template);
    return { message: 'Template deleted successfully' };
  }
}
