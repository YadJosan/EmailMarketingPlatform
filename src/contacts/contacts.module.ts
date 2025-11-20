import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Audience } from './entities/audience.entity';
import { Segment } from './entities/segment.entity';
import { ContactsService } from './contacts.service';
import { ContactsImportService } from './contacts-import.service';
import { SegmentsService } from './segments.service';
import { ContactsController } from './contacts.controller';
import { SegmentsController } from './segments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Audience, Segment])],
  providers: [ContactsService, ContactsImportService, SegmentsService],
  controllers: [ContactsController, SegmentsController],
  exports: [ContactsService, SegmentsService],
})
export class ContactsModule {}
