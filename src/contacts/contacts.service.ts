import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact, ContactStatus, ContactSource } from './entities/contact.entity';
import { Audience } from './entities/audience.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    @InjectRepository(Audience)
    private audienceRepo: Repository<Audience>,
  ) {}

  async create(workspaceId: string, data: Partial<Contact>) {
    const contact = this.contactRepo.create({
      ...data,
      workspaceId,
      status: ContactStatus.SUBSCRIBED,
      source: data.source || ContactSource.MANUAL,
      subscribedAt: new Date(),
    });
    return this.contactRepo.save(contact);
  }

  async findByWorkspace(
    workspaceId: string,
    filters?: { status?: ContactStatus; tag?: string; search?: string },
  ) {
    const queryBuilder = this.contactRepo
      .createQueryBuilder('contact')
      .where('contact.workspaceId = :workspaceId', { workspaceId });

    if (filters?.status) {
      queryBuilder.andWhere('contact.status = :status', { status: filters.status });
    }

    if (filters?.tag) {
      queryBuilder.andWhere(':tag = ANY(contact.tags)', { tag: filters.tag });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(contact.email ILIKE :search OR contact.firstName ILIKE :search OR contact.lastName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder.orderBy('contact.createdAt', 'DESC').getMany();
  }

  async findOne(contactId: string, workspaceId: string) {
    const contact = await this.contactRepo.findOne({
      where: { id: contactId, workspaceId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(contactId: string, workspaceId: string, data: Partial<Contact>) {
    const contact = await this.findOne(contactId, workspaceId);
    Object.assign(contact, data);
    return this.contactRepo.save(contact);
  }

  async delete(contactId: string, workspaceId: string) {
    const contact = await this.findOne(contactId, workspaceId);
    await this.contactRepo.remove(contact);
    return { message: 'Contact deleted successfully' };
  }

  async addToAudience(contactId: string, audienceId: string, workspaceId: string) {
    const contact = await this.contactRepo.findOne({
      where: { id: contactId, workspaceId },
      relations: ['audiences'],
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const audience = await this.audienceRepo.findOne({ 
      where: { id: audienceId, workspaceId },
    });

    if (!audience) {
      throw new NotFoundException('Audience not found');
    }

    // Verify both belong to same workspace
    if (contact.workspaceId !== audience.workspaceId) {
      throw new ForbiddenException('Contact and audience must belong to the same workspace');
    }
    
    if (!contact.audiences) contact.audiences = [];
    contact.audiences.push(audience);
    return this.contactRepo.save(contact);
  }

  async createAudience(workspaceId: string, name: string, description?: string) {
    const audience = this.audienceRepo.create({
      workspaceId,
      name,
      description,
    });
    return this.audienceRepo.save(audience);
  }

  async findAudiencesByWorkspace(workspaceId: string) {
    return this.audienceRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(contactId: string, workspaceId: string, status: ContactStatus) {
    const contact = await this.findOne(contactId, workspaceId);
    contact.status = status;

    if (status === ContactStatus.SUBSCRIBED) {
      contact.subscribedAt = new Date();
      contact.unsubscribedAt = null;
    } else if (status === ContactStatus.UNSUBSCRIBED) {
      contact.unsubscribedAt = new Date();
    }

    return this.contactRepo.save(contact);
  }

  async addTags(contactId: string, workspaceId: string, tags: string[]) {
    const contact = await this.findOne(contactId, workspaceId);
    const currentTags = contact.tags || [];
    contact.tags = [...new Set([...currentTags, ...tags])];
    return this.contactRepo.save(contact);
  }

  async removeTags(contactId: string, workspaceId: string, tags: string[]) {
    const contact = await this.findOne(contactId, workspaceId);
    contact.tags = (contact.tags || []).filter((tag) => !tags.includes(tag));
    return this.contactRepo.save(contact);
  }

  async bulkDelete(ids: string[], workspaceId: string) {
    const contacts = await this.contactRepo.find({
      where: ids.map((id) => ({ id, workspaceId })),
    });

    if (contacts.length !== ids.length) {
      throw new NotFoundException('Some contacts not found');
    }

    await this.contactRepo.remove(contacts);
    return { message: `${contacts.length} contacts deleted successfully` };
  }

  async bulkAddTags(ids: string[], workspaceId: string, tags: string[]) {
    const contacts = await this.contactRepo.find({
      where: ids.map((id) => ({ id, workspaceId })),
    });

    if (contacts.length !== ids.length) {
      throw new NotFoundException('Some contacts not found');
    }

    contacts.forEach((contact) => {
      const currentTags = contact.tags || [];
      contact.tags = [...new Set([...currentTags, ...tags])];
    });

    await this.contactRepo.save(contacts);
    return { message: `Tags added to ${contacts.length} contacts` };
  }
}
