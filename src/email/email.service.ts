import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private sesClient: SESClient;

  constructor(private config: ConfigService) {
    this.sesClient = new SESClient({
      region: this.config.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async sendEmail(params: {
    to: string;
    from: string;
    subject: string;
    html: string;
    replyTo?: string;
  }) {
    const command = new SendEmailCommand({
      Source: params.from,
      Destination: { ToAddresses: [params.to] },
      Message: {
        Subject: { Data: params.subject },
        Body: { Html: { Data: params.html } },
      },
      ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
    });

    return this.sesClient.send(command);
  }
}
