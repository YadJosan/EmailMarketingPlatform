import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from './entities/form.entity';

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private formRepo: Repository<Form>,
  ) {}

  async create(workspaceId: string, data: Partial<Form>) {
    const form = this.formRepo.create({ ...data, workspaceId });
    return this.formRepo.save(form);
  }

  async findByWorkspace(workspaceId: string) {
    return this.formRepo.find({ where: { workspaceId } });
  }
}
