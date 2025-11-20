import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { EmailService } from '../../email/email.service';

@Injectable()
@Processor('email-send', {
  limiter: { max: 14, duration: 1000 }, // SES rate limit
})
export class EmailSendProcessor extends WorkerHost {
  constructor(private emailService: EmailService) {
    super();
  }

  async process(job: Job) {
    const { to, from, subject, html, replyTo } = job.data;
    
    try {
      await this.emailService.sendEmail({ to, from, subject, html, replyTo });
      return { success: true };
    } catch (error) {
      throw error; // BullMQ will retry
    }
  }
}
