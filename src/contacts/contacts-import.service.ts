import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { Contact, ContactStatus, ContactSource } from './entities/contact.entity';
import { Audience } from './entities/audience.entity';

export interface ValidationError {
  row: number;
  email: string;
  field: string;
  message: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ValidationError[];
  warnings: string[];
  contacts: Array<{ id: string; email: string; status: string }>;
}

@Injectable()
export class ContactsImportService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_ROWS = 10000;
  private readonly REQUIRED_COLUMNS = ['email'];
  private readonly OPTIONAL_COLUMNS = [
    'firstName',
    'first_name',
    'lastName',
    'last_name',
    'tags',
    'status',
  ];

  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    @InjectRepository(Audience)
    private audienceRepo: Repository<Audience>,
  ) {}

  async importFromCsv(
    workspaceId: string,
    audienceId: string | null,
    csvContent: string,
    options?: {
      updateExisting?: boolean;
      skipInvalid?: boolean;
    },
  ): Promise<ImportResult> {
    // Validate file size
    if (csvContent.length > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Parse CSV
    let records: any[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
      });
    } catch (error) {
      throw new BadRequestException(`CSV parsing error: ${error.message}`);
    }

    // Validate row count
    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    if (records.length > this.MAX_ROWS) {
      throw new BadRequestException(`CSV file exceeds maximum of ${this.MAX_ROWS} rows`);
    }

    // Validate columns
    this.validateColumns(records[0]);

    // Validate audience if provided
    let audience: Audience | null = null;
    if (audienceId) {
      audience = await this.audienceRepo.findOne({
        where: { id: audienceId, workspaceId },
      });
      if (!audience) {
        throw new BadRequestException('Audience not found');
      }
    }

    // Initialize results
    const results: ImportResult = {
      total: records.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      warnings: [],
      contacts: [],
    };

    // Process records
    const emailsSeen = new Set<string>();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 for header row and 0-index

      try {
        // Validate and normalize email
        const email = this.normalizeEmail(record.email);
        if (!email) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            email: record.email || 'N/A',
            field: 'email',
            message: 'Email is required',
          });
          continue;
        }

        // Validate email format
        if (!this.isValidEmail(email)) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            email,
            field: 'email',
            message: 'Invalid email format',
          });
          continue;
        }

        // Check for duplicates in CSV
        if (emailsSeen.has(email)) {
          results.skipped++;
          results.warnings.push(`Row ${rowNumber}: Duplicate email ${email} in CSV`);
          continue;
        }
        emailsSeen.add(email);

        // Validate name fields
        const firstName = this.sanitizeString(
          record.firstName || record.first_name || '',
          50,
        );
        const lastName = this.sanitizeString(record.lastName || record.last_name || '', 50);

        // Validate and parse tags
        const tags = this.parseTags(record.tags);

        // Validate status
        const status = this.validateStatus(record.status);

        // Check if contact exists
        const existing = await this.contactRepo.findOne({
          where: { workspaceId, email },
          relations: ['audiences'],
        });

        if (existing) {
          if (options?.updateExisting) {
            // Update existing contact
            existing.firstName = firstName || existing.firstName;
            existing.lastName = lastName || existing.lastName;
            existing.tags = [...new Set([...(existing.tags || []), ...tags])];
            existing.customFields = {
              ...existing.customFields,
              ...this.extractCustomFields(record),
            };

            // Add to audience if specified
            if (audience && !existing.audiences?.some((a) => a.id === audience.id)) {
              if (!existing.audiences) existing.audiences = [];
              existing.audiences.push(audience);
            }

            await this.contactRepo.save(existing);
            results.updated++;
            results.contacts.push({
              id: existing.id,
              email: existing.email,
              status: 'updated',
            });
          } else {
            results.skipped++;
            results.warnings.push(`Row ${rowNumber}: Contact ${email} already exists`);
          }
          continue;
        }

        // Create new contact
        const contact = this.contactRepo.create({
          workspaceId,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          customFields: this.extractCustomFields(record),
          tags,
          status: status || ContactStatus.SUBSCRIBED,
          source: ContactSource.IMPORT,
          subscribedAt: new Date(),
        });

        // Add to audience if specified
        if (audience) {
          contact.audiences = [audience];
        }

        const saved = await this.contactRepo.save(contact);
        results.imported++;
        results.contacts.push({
          id: saved.id,
          email: saved.email,
          status: 'imported',
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          email: record.email || 'N/A',
          field: 'general',
          message: error.message,
        });
      }
    }

    return results;
  }

  async validateCsv(csvContent: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    preview: any[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (csvContent.length > this.MAX_FILE_SIZE) {
      errors.push('File size exceeds 5MB limit');
      return { valid: false, errors, warnings, preview: [] };
    }

    // Parse CSV
    let records: any[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
      });
    } catch (error) {
      errors.push(`CSV parsing error: ${error.message}`);
      return { valid: false, errors, warnings, preview: [] };
    }

    // Check if empty
    if (records.length === 0) {
      errors.push('CSV file is empty');
      return { valid: false, errors, warnings, preview: [] };
    }

    // Check row count
    if (records.length > this.MAX_ROWS) {
      errors.push(`CSV file exceeds maximum of ${this.MAX_ROWS} rows`);
    }

    // Validate columns
    try {
      this.validateColumns(records[0]);
    } catch (error) {
      errors.push(error.message);
    }

    // Validate sample rows
    const sampleSize = Math.min(10, records.length);
    const emailsSeen = new Set<string>();

    for (let i = 0; i < sampleSize; i++) {
      const record = records[i];
      const email = this.normalizeEmail(record.email);

      if (!email) {
        warnings.push(`Row ${i + 2}: Missing email`);
      } else if (!this.isValidEmail(email)) {
        warnings.push(`Row ${i + 2}: Invalid email format: ${email}`);
      } else if (emailsSeen.has(email)) {
        warnings.push(`Row ${i + 2}: Duplicate email: ${email}`);
      }

      emailsSeen.add(email);
    }

    // Check for duplicates in full dataset
    const allEmails = new Set<string>();
    let duplicateCount = 0;
    records.forEach((record, i) => {
      const email = this.normalizeEmail(record.email);
      if (email && allEmails.has(email)) {
        duplicateCount++;
      }
      allEmails.add(email);
    });

    if (duplicateCount > 0) {
      warnings.push(`Found ${duplicateCount} duplicate emails in CSV`);
    }

    // Generate preview
    const preview = records.slice(0, 5).map((record) => ({
      email: record.email,
      firstName: record.firstName || record.first_name,
      lastName: record.lastName || record.last_name,
      tags: record.tags,
    }));

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      preview,
    };
  }

  private validateColumns(firstRow: any): void {
    const columns = Object.keys(firstRow);

    // Check for required columns
    const hasEmail = columns.some((col) =>
      ['email', 'Email', 'EMAIL', 'e-mail'].includes(col),
    );

    if (!hasEmail) {
      throw new BadRequestException('CSV must contain an "email" column');
    }
  }

  private normalizeEmail(email: any): string | null {
    if (!email) return null;
    return String(email).trim().toLowerCase();
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  private sanitizeString(value: any, maxLength: number): string {
    if (!value) return '';
    return String(value).trim().substring(0, maxLength);
  }

  private parseTags(tagsString: any): string[] {
    if (!tagsString) return [];

    const tags = String(tagsString)
      .split(/[,;|]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && tag.length <= 50);

    return [...new Set(tags)].slice(0, 10); // Max 10 unique tags
  }

  private validateStatus(status: any): ContactStatus | null {
    if (!status) return null;

    const normalized = String(status).toLowerCase().trim();
    const validStatuses = Object.values(ContactStatus);

    if (validStatuses.includes(normalized as ContactStatus)) {
      return normalized as ContactStatus;
    }

    return null;
  }

  private extractCustomFields(record: any): Record<string, any> {
    const standardFields = [
      'email',
      'Email',
      'EMAIL',
      'first_name',
      'firstName',
      'last_name',
      'lastName',
      'tags',
      'status',
    ];

    const customFields: Record<string, any> = {};

    for (const [key, value] of Object.entries(record)) {
      if (!standardFields.includes(key) && value) {
        const sanitizedKey = key.trim().substring(0, 50);
        const sanitizedValue = String(value).trim().substring(0, 500);
        if (sanitizedKey && sanitizedValue) {
          customFields[sanitizedKey] = sanitizedValue;
        }
      }
    }

    return customFields;
  }
}
