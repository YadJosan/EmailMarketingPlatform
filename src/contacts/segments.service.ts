import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Segment } from './entities/segment.entity';
import { Contact } from './entities/contact.entity';
import { Audience } from './entities/audience.entity';

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
}

export interface FilterRules {
  operator: 'AND' | 'OR';
  conditions: FilterCondition[];
}

@Injectable()
export class SegmentsService {
  constructor(
    @InjectRepository(Segment)
    private segmentRepo: Repository<Segment>,
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    @InjectRepository(Audience)
    private audienceRepo: Repository<Audience>,
  ) {}

  async create(workspaceId: string, data: { name: string; audienceId?: string; filterRules: FilterRules }) {
    // Validate audience if provided
    if (data.audienceId) {
      const audience = await this.audienceRepo.findOne({
        where: { id: data.audienceId, workspaceId },
      });
      if (!audience) {
        throw new NotFoundException('Audience not found');
      }
    }

    const segment = this.segmentRepo.create({
      workspaceId,
      name: data.name,
      audienceId: data.audienceId,
      filterRules: data.filterRules,
    });

    return this.segmentRepo.save(segment);
  }

  async findByWorkspace(workspaceId: string) {
    return this.segmentRepo.find({
      where: { workspaceId },
      relations: ['audience'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(segmentId: string, workspaceId: string) {
    const segment = await this.segmentRepo.findOne({
      where: { id: segmentId, workspaceId },
      relations: ['audience'],
    });

    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    return segment;
  }

  async update(segmentId: string, workspaceId: string, data: Partial<Segment>) {
    const segment = await this.findOne(segmentId, workspaceId);
    Object.assign(segment, data);
    return this.segmentRepo.save(segment);
  }

  async delete(segmentId: string, workspaceId: string) {
    const segment = await this.findOne(segmentId, workspaceId);
    await this.segmentRepo.remove(segment);
    return { message: 'Segment deleted successfully' };
  }

  async evaluateSegment(segmentId: string, workspaceId: string): Promise<Contact[]> {
    const segment = await this.findOne(segmentId, workspaceId);
    return this.evaluateFilterRules(workspaceId, segment.filterRules, segment.audienceId);
  }

  async evaluateFilterRules(
    workspaceId: string,
    filterRules: FilterRules,
    audienceId?: string,
  ): Promise<Contact[]> {
    let query = this.contactRepo
      .createQueryBuilder('contact')
      .where('contact.workspaceId = :workspaceId', { workspaceId });

    // If audience is specified, join and filter by audience
    if (audienceId) {
      query = query
        .innerJoin('contact.audiences', 'audience')
        .andWhere('audience.id = :audienceId', { audienceId });
    }

    // Apply filter conditions
    query = this.applyFilterConditions(query, filterRules);

    return query.getMany();
  }

  async getSegmentCount(segmentId: string, workspaceId: string): Promise<number> {
    const segment = await this.findOne(segmentId, workspaceId);
    
    let query = this.contactRepo
      .createQueryBuilder('contact')
      .where('contact.workspaceId = :workspaceId', { workspaceId });

    if (segment.audienceId) {
      query = query
        .innerJoin('contact.audiences', 'audience')
        .andWhere('audience.id = :audienceId', { audienceId: segment.audienceId });
    }

    query = this.applyFilterConditions(query, segment.filterRules);

    return query.getCount();
  }

  private applyFilterConditions(
    query: SelectQueryBuilder<Contact>,
    filterRules: FilterRules,
  ): SelectQueryBuilder<Contact> {
    if (!filterRules.conditions || filterRules.conditions.length === 0) {
      return query;
    }

    const operator = filterRules.operator === 'OR' ? 'orWhere' : 'andWhere';
    const conditions: string[] = [];
    const parameters: Record<string, any> = {};

    filterRules.conditions.forEach((condition, index) => {
      const paramKey = `param_${index}`;
      const { whereClause, params } = this.buildWhereClause(condition, paramKey);
      
      if (whereClause) {
        conditions.push(whereClause);
        Object.assign(parameters, params);
      }
    });

    if (conditions.length > 0) {
      if (filterRules.operator === 'OR') {
        query = query.andWhere(`(${conditions.join(' OR ')})`, parameters);
      } else {
        conditions.forEach((condition) => {
          query = query.andWhere(condition, parameters);
        });
      }
    }

    return query;
  }

  private buildWhereClause(
    condition: FilterCondition,
    paramKey: string,
  ): { whereClause: string; params: Record<string, any> } {
    const { field, operator, value } = condition;
    const params: Record<string, any> = {};

    // Handle standard fields
    const standardFields = ['email', 'firstName', 'lastName', 'status', 'source'];
    const isStandardField = standardFields.includes(field);
    const fieldPath = isStandardField ? `contact.${field}` : `contact.customFields->>'${field}'`;

    switch (operator) {
      case 'equals':
        params[paramKey] = value;
        return { whereClause: `${fieldPath} = :${paramKey}`, params };

      case 'not_equals':
        params[paramKey] = value;
        return { whereClause: `${fieldPath} != :${paramKey}`, params };

      case 'contains':
        params[paramKey] = `%${value}%`;
        return { whereClause: `${fieldPath} ILIKE :${paramKey}`, params };

      case 'not_contains':
        params[paramKey] = `%${value}%`;
        return { whereClause: `${fieldPath} NOT ILIKE :${paramKey}`, params };

      case 'starts_with':
        params[paramKey] = `${value}%`;
        return { whereClause: `${fieldPath} ILIKE :${paramKey}`, params };

      case 'ends_with':
        params[paramKey] = `%${value}`;
        return { whereClause: `${fieldPath} ILIKE :${paramKey}`, params };

      case 'greater_than':
        params[paramKey] = value;
        return { whereClause: `${fieldPath}::numeric > :${paramKey}`, params };

      case 'less_than':
        params[paramKey] = value;
        return { whereClause: `${fieldPath}::numeric < :${paramKey}`, params };

      case 'in':
        params[paramKey] = Array.isArray(value) ? value : [value];
        return { whereClause: `${fieldPath} IN (:...${paramKey})`, params };

      case 'not_in':
        params[paramKey] = Array.isArray(value) ? value : [value];
        return { whereClause: `${fieldPath} NOT IN (:...${paramKey})`, params };

      case 'exists':
        if (isStandardField) {
          return { whereClause: `${fieldPath} IS NOT NULL`, params };
        }
        return { whereClause: `contact.customFields ? '${field}'`, params };

      case 'not_exists':
        if (isStandardField) {
          return { whereClause: `${fieldPath} IS NULL`, params };
        }
        return { whereClause: `NOT (contact.customFields ? '${field}')`, params };

      default:
        return { whereClause: '', params: {} };
    }
  }

  // Helper method to test filter rules without saving
  async testFilterRules(workspaceId: string, filterRules: FilterRules, audienceId?: string) {
    const contacts = await this.evaluateFilterRules(workspaceId, filterRules, audienceId);
    return {
      count: contacts.length,
      preview: contacts.slice(0, 10).map((c) => ({
        id: c.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
      })),
    };
  }
}
