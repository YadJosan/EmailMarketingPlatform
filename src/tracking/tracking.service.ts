import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignEmail } from '../campaigns/entities/campaign-email.entity';
import { EmailEvent, EmailEventType } from '../analytics/entities/email-event.entity';
import * as crypto from 'crypto';

interface TrackingMetadata {
  userAgent?: string;
  ip?: string;
  referer?: string;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(CampaignEmail)
    private campaignEmailRepo: Repository<CampaignEmail>,
    @InjectRepository(EmailEvent)
    private emailEventRepo: Repository<EmailEvent>,
  ) {}

  /**
   * Generate tracking token for a campaign email
   */
  generateTrackingToken(campaignEmailId: string): string {
    const secret = process.env.TRACKING_SECRET || 'default-secret-change-me';
    const data = `${campaignEmailId}:${Date.now()}`;
    const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
    
    // Encode campaignEmailId and hash
    return Buffer.from(`${campaignEmailId}:${hash}`).toString('base64url');
  }

  /**
   * Decode and verify tracking token
   */
  private decodeTrackingToken(token: string): string | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const [campaignEmailId] = decoded.split(':');
      return campaignEmailId;
    } catch (error) {
      this.logger.error(`Failed to decode tracking token: ${error.message}`);
      return null;
    }
  }

  /**
   * Track email open
   */
  async trackOpen(token: string, metadata: TrackingMetadata): Promise<void> {
    const campaignEmailId = this.decodeTrackingToken(token);
    
    if (!campaignEmailId) {
      this.logger.warn(`Invalid tracking token: ${token}`);
      return;
    }

    try {
      const campaignEmail = await this.campaignEmailRepo.findOne({
        where: { id: campaignEmailId },
      });

      if (!campaignEmail) {
        this.logger.warn(`Campaign email not found: ${campaignEmailId}`);
        return;
      }

      // Update open count and timestamp
      campaignEmail.openCount += 1;
      campaignEmail.lastOpenedAt = new Date();
      await this.campaignEmailRepo.save(campaignEmail);

      // Create event record
      const event = this.emailEventRepo.create({
        campaignEmailId,
        eventType: EmailEventType.OPENED,
        metadata: {
          userAgent: metadata.userAgent,
          ip: metadata.ip,
          referer: metadata.referer,
        },
      });
      await this.emailEventRepo.save(event);

      this.logger.log(`Tracked open for campaign email: ${campaignEmailId}`);
    } catch (error) {
      this.logger.error(`Error tracking open: ${error.message}`);
    }
  }

  /**
   * Track link click
   */
  async trackClick(token: string, url: string, metadata: TrackingMetadata): Promise<void> {
    const campaignEmailId = this.decodeTrackingToken(token);
    
    if (!campaignEmailId) {
      this.logger.warn(`Invalid tracking token: ${token}`);
      return;
    }

    try {
      const campaignEmail = await this.campaignEmailRepo.findOne({
        where: { id: campaignEmailId },
      });

      if (!campaignEmail) {
        this.logger.warn(`Campaign email not found: ${campaignEmailId}`);
        return;
      }

      // Update click count and timestamp
      campaignEmail.clickCount += 1;
      campaignEmail.lastClickedAt = new Date();
      await this.campaignEmailRepo.save(campaignEmail);

      // Create event record
      const event = this.emailEventRepo.create({
        campaignEmailId,
        eventType: EmailEventType.CLICKED,
        metadata: {
          url,
          userAgent: metadata.userAgent,
          ip: metadata.ip,
          referer: metadata.referer,
        },
      });
      await this.emailEventRepo.save(event);

      this.logger.log(`Tracked click for campaign email: ${campaignEmailId}, URL: ${url}`);
    } catch (error) {
      this.logger.error(`Error tracking click: ${error.message}`);
    }
  }

  /**
   * Generate tracking pixel HTML
   */
  getTrackingPixelHtml(campaignEmailId: string): string {
    const token = this.generateTrackingToken(campaignEmailId);
    const trackingDomain = process.env.TRACKING_DOMAIN || 'http://localhost:3000';
    const pixelUrl = `${trackingDomain}/track/open/${token}`;
    
    return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;border:0;outline:none;" />`;
  }

  /**
   * Wrap links with click tracking
   */
  wrapLinksWithTracking(html: string, campaignEmailId: string): string {
    const token = this.generateTrackingToken(campaignEmailId);
    const trackingDomain = process.env.TRACKING_DOMAIN || 'http://localhost:3000';
    
    // Replace all href attributes with tracking URLs
    return html.replace(
      /href=["']([^"']+)["']/gi,
      (match, url) => {
        // Skip mailto, tel, and anchor links
        if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
          return match;
        }
        
        // Skip unsubscribe links (handle separately)
        if (url.includes('/unsubscribe')) {
          return match;
        }
        
        const trackingUrl = `${trackingDomain}/track/click/${token}?url=${encodeURIComponent(url)}`;
        return `href="${trackingUrl}"`;
      }
    );
  }

  /**
   * Add tracking to email HTML
   */
  addTrackingToEmail(html: string, campaignEmailId: string): string {
    // Add click tracking to links
    let trackedHtml = this.wrapLinksWithTracking(html, campaignEmailId);
    
    // Add tracking pixel before closing body tag
    const trackingPixel = this.getTrackingPixelHtml(campaignEmailId);
    
    if (trackedHtml.includes('</body>')) {
      trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}</body>`);
    } else {
      // If no body tag, append at the end
      trackedHtml += trackingPixel;
    }
    
    return trackedHtml;
  }
}
