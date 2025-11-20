import { Controller, Get, Param, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { TrackingService } from './tracking.service';

@Controller('track')
export class TrackingController {
  constructor(private trackingService: TrackingService) {}

  @Get('open/:token')
  async trackOpen(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Track the open event
    await this.trackingService.trackOpen(token, {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for'] as string,
      referer: req.headers['referer'],
    });

    // Return 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64',
    );

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Length', pixel.length);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.send(pixel);
  }

  @Get('click/:token')
  async trackClick(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const url = req.query.url as string;

    if (!url) {
      return res.status(400).send('Missing URL parameter');
    }

    // Track the click event
    await this.trackingService.trackClick(token, url, {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for'] as string,
      referer: req.headers['referer'],
    });

    // Redirect to the actual URL
    res.redirect(url);
  }
}
