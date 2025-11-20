import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { EmailService } from '../../email/email.service';

@Injectable()
@Processor('email-send', {
  limiter: { 
    max: parseInt(process.env.EMAIL_RATE_LIMIT || '14'), 
    duration: 1000 
  },
  concurrency: parseInt(process.env.EMAIL_CONCURRENCY || '5'),
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
