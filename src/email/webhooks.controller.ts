import { Controller, Post, Body, Headers } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('ses')
  async handleSesWebhook(
    @Body() body: any,
    @Headers('x-amz-sns-message-type') messageType: string,
  ) {
    // Handle SNS subscription confirmation
    if (messageType === 'SubscriptionConfirmation') {
      await this.webhooksService.confirmSubscription(body.SubscribeURL);
      return { message: 'Subscription confirmed' };
    }

    // Handle SNS notification
    if (messageType === 'Notification') {
      const message = JSON.parse(body.Message);
      await this.webhooksService.handleSesNotification(message);
      return { message: 'Notification processed' };
    }

    return { message: 'Unknown message type' };
  }
}
