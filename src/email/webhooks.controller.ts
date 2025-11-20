import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('ses')
  @HttpCode(200)
  async handleSesWebhook(@Body() body: any) {
    // AWS SNS sends subscription confirmation first
    if (body.Type === 'SubscriptionConfirmation') {
      await this.webhooksService.confirmSubscription(body.SubscribeURL);
      return { message: 'Subscription confirmed' };
    }

    // Handle actual notifications
    if (body.Type === 'Notification') {
      const message = JSON.parse(body.Message);
      await this.webhooksService.handleSesNotification(message);
      return { message: 'Notification processed' };
    }

    return { message: 'Unknown notification type' };
  }
}
