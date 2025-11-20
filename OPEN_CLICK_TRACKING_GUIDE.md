# Open & Click Tracking Guide

## Overview

Pixel-based open tracking and link click tracking automatically added to all campaign emails.

## How It Works

### Open Tracking (Pixel-Based)

**1. Tracking Pixel Injection:**
When an email is sent, a 1x1 transparent GIF is automatically added:
```html
<img src="https://yourdomain.com/track/open/TOKEN" 
     width="1" height="1" alt="" 
     style="display:block;border:0;outline:none;" />
```

**2. When Email is Opened:**
- Email client loads the image
- Server receives GET request
- Records open event with metadata
- Returns transparent pixel
- Updates `openCount` and `lastOpenedAt`

**3. Tracked Metadata:**
- User agent (email client)
- IP address
- Timestamp
- Referer (if available)

### Click Tracking

**1. Link Wrapping:**
All links in email HTML are automatically wrapped:
```html
<!-- Original -->
<a href="https://example.com/product">View Product</a>

<!-- Tracked -->
<a href="https://yourdomain.com/track/click/TOKEN?url=https%3A%2F%2Fexample.com%2Fproduct">
  View Product
</a>
```

**2. When Link is Clicked:**
- User clicks tracked link
- Server records click event
- Redirects to original URL
- Updates `clickCount` and `lastClickedAt`

**3. Excluded Links:**
- `mailto:` links
- `tel:` links
- Anchor links (`#section`)
- Unsubscribe links (handled separately)

## API Endpoints

### Track Open

```
GET /track/open/:token
```

**Response:** 1x1 transparent GIF

**Side Effects:**
- Increments `openCount`
- Updates `lastOpenedAt`
- Creates `EmailEvent` with type `OPENED`

### Track Click

```
GET /track/click/:token?url=<encoded_url>
```

**Response:** 302 redirect to original URL

**Side Effects:**
- Increments `clickCount`
- Updates `lastClickedAt`
- Creates `EmailEvent` with type `CLICKED`

## Configuration

### Environment Variables

```bash
# .env
TRACKING_DOMAIN=https://yourdomain.com
TRACKING_SECRET=your-secret-key-change-in-production
```

**TRACKING_DOMAIN:**
- Your public domain where tracking endpoints are hosted
- Must be accessible from email clients
- Use HTTPS in production

**TRACKING_SECRET:**
- Secret key for generating tracking tokens
- Change from default in production
- Used to prevent token tampering

## Security

### Token Generation

Tokens are generated using HMAC-SHA256:

```typescript
const data = `${campaignEmailId}:${Date.now()}`;
const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
const token = Buffer.from(`${campaignEmailId}:${hash}`).toString('base64url');
```

**Benefits:**
- Tamper-proof
- Time-based (includes timestamp)
- URL-safe (base64url encoding)
- No sensitive data exposed

### Privacy Considerations

**What We Track:**
- Email opens (when pixel loads)
- Link clicks (when links are clicked)
- User agent (email client info)
- IP address (for geolocation)

**What We DON'T Track:**
- Email content reading time
- Cursor movements
- Keyboard activity
- Personal browsing history

**Compliance:**
- GDPR: Disclose tracking in privacy policy
- CAN-SPAM: Provide unsubscribe option
- CCPA: Allow opt-out of tracking

## Limitations

### Open Tracking Limitations

**1. Image Blocking:**
- Many email clients block images by default
- User must enable images to trigger pixel
- Results in underreported open rates

**2. Privacy Features:**
- Apple Mail Privacy Protection (iOS 15+)
- Prefetches images on server
- Opens appear even if user didn't open
- Can inflate open rates

**3. Plain Text Emails:**
- No HTML = no pixel
- Opens cannot be tracked
- Only clicks can be tracked (if links included)

### Click Tracking Limitations

**1. Link Scanners:**
- Security tools may pre-click links
- Can inflate click counts
- Difficult to distinguish from real clicks

**2. URL Length:**
- Tracked URLs are longer
- May be truncated in some clients
- Use URL shorteners if needed

## Accuracy Expectations

### Typical Metrics

**Open Rate:**
- Reported: 15-25%
- Actual: 20-35% (due to image blocking)
- Apple Mail users: May be inflated

**Click Rate:**
- More accurate than opens
- Typically 2-5% of recipients
- Less affected by privacy features

**Click-to-Open Rate:**
- Most reliable metric
- Shows engagement quality
- Typically 10-20%

## Implementation Details

### Automatic Injection

Tracking is automatically added when emails are queued:

```typescript
// In campaigns.service.ts
let html = this.renderEmail(campaign.content, contact);

// Add tracking pixel and wrap links
html = this.trackingService.addTrackingToEmail(html, campaignEmail.id);
```

### Tracking Service Methods

```typescript
// Generate tracking pixel HTML
getTrackingPixelHtml(campaignEmailId: string): string

// Wrap all links with tracking
wrapLinksWithTracking(html: string, campaignEmailId: string): string

// Add both pixel and link tracking
addTrackingToEmail(html: string, campaignEmailId: string): string
```

## Testing

### Test Open Tracking

```bash
# Send test email
POST /campaigns/:workspaceId/:campaignId/send

# Open email in client
# Check tracking endpoint was called
GET /track/open/:token

# Verify event recorded
GET /campaigns/:workspaceId/:campaignId/recipients/:contactId
```

### Test Click Tracking

```bash
# Click link in email
# Should redirect through tracking URL

# Verify click recorded
GET /campaigns/:workspaceId/:campaignId/recipients/:contactId
# Should show clickCount: 1
```

### Local Testing

For local development, use ngrok or similar:

```bash
# Start ngrok
ngrok http 3000

# Update .env
TRACKING_DOMAIN=https://abc123.ngrok.io

# Send test email
# Tracking will work even locally
```

## Monitoring

### Check Tracking Health

```typescript
// Get campaign stats
const stats = await getCampaignStats(campaignId);

console.log(`Open Rate: ${stats.summary.openRate}%`);
console.log(`Click Rate: ${stats.summary.clickRate}%`);
console.log(`Unique Opens: ${stats.summary.uniqueOpens}`);
console.log(`Unique Clicks: ${stats.summary.uniqueClicks}`);
```

### Identify Issues

**Low Open Rate (<10%):**
- Check if tracking pixel is being added
- Verify TRACKING_DOMAIN is accessible
- Test with different email clients

**No Clicks Tracked:**
- Verify links are being wrapped
- Check if redirects are working
- Test click URLs manually

## Advanced Features

### Custom Tracking Parameters

Add UTM parameters for analytics:

```typescript
// In tracking.service.ts
wrapLinksWithTracking(html: string, campaignEmailId: string): string {
  return html.replace(/href=["']([^"']+)["']/gi, (match, url) => {
    // Add UTM parameters
    const separator = url.includes('?') ? '&' : '?';
    const utmParams = `utm_source=email&utm_medium=campaign&utm_campaign=${campaignId}`;
    const fullUrl = `${url}${separator}${utmParams}`;
    
    // Then wrap with tracking
    const trackingUrl = `${trackingDomain}/track/click/${token}?url=${encodeURIComponent(fullUrl)}`;
    return `href="${trackingUrl}"`;
  });
}
```

### Geolocation Tracking

Add IP-based geolocation:

```bash
npm install geoip-lite
```

```typescript
import * as geoip from 'geoip-lite';

async trackOpen(token: string, metadata: TrackingMetadata) {
  const geo = geoip.lookup(metadata.ip);
  
  const event = this.emailEventRepo.create({
    campaignEmailId,
    eventType: EmailEventType.OPENED,
    metadata: {
      ...metadata,
      country: geo?.country,
      city: geo?.city,
      timezone: geo?.timezone,
    },
  });
}
```

### Bot Detection

Filter out bot opens/clicks:

```typescript
private isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

async trackOpen(token: string, metadata: TrackingMetadata) {
  if (this.isBot(metadata.userAgent)) {
    this.logger.debug('Bot detected, skipping tracking');
    return;
  }
  
  // Continue with tracking...
}
```

## Best Practices

1. **Always Use HTTPS**
   - Tracking domain must use HTTPS
   - Prevents security warnings
   - Required by many email clients

2. **Keep Tokens Short**
   - Use base64url encoding
   - Avoid long query parameters
   - Consider URL shorteners for very long URLs

3. **Handle Errors Gracefully**
   - Invalid tokens should fail silently
   - Return pixel even on errors
   - Log errors for debugging

4. **Respect Privacy**
   - Disclose tracking in emails
   - Provide opt-out mechanism
   - Don't track sensitive actions

5. **Monitor Performance**
   - Track endpoint response times
   - Cache tracking pixel
   - Use CDN for pixel delivery

## Troubleshooting

### Tracking Not Working

**Check:**
1. TRACKING_DOMAIN is set correctly
2. Tracking endpoints are accessible
3. Pixel is being added to HTML
4. Links are being wrapped

**Debug:**
```bash
# Check if pixel is in email
curl -X POST /campaigns/:id/preview | grep "track/open"

# Test tracking endpoint
curl https://yourdomain.com/track/open/test-token

# Check logs
docker-compose logs -f backend | grep "Tracked open"
```

### Opens Not Recorded

**Possible Causes:**
- Images blocked in email client
- TRACKING_DOMAIN not accessible
- Invalid tracking token
- Database connection issues

**Solutions:**
- Test with images enabled
- Verify domain DNS/SSL
- Check token generation
- Review error logs

### Clicks Not Redirecting

**Possible Causes:**
- URL encoding issues
- Missing URL parameter
- Redirect not working

**Solutions:**
```typescript
// Test click tracking
const testUrl = 'https://example.com/test';
const trackingUrl = `/track/click/${token}?url=${encodeURIComponent(testUrl)}`;
console.log('Test URL:', trackingUrl);
```

## Performance Optimization

### Cache Tracking Pixel

```typescript
// In tracking.controller.ts
private cachedPixel: Buffer;

constructor() {
  this.cachedPixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
}

@Get('open/:token')
async trackOpen(@Param('token') token: string, @Res() res: Response) {
  // Track asynchronously
  this.trackingService.trackOpen(token, metadata).catch(err => 
    this.logger.error('Tracking error:', err)
  );
  
  // Return cached pixel immediately
  res.setHeader('Content-Type', 'image/gif');
  res.send(this.cachedPixel);
}
```

### Batch Event Inserts

For high-volume campaigns:

```typescript
private eventQueue: EmailEvent[] = [];

async trackOpen(token: string, metadata: TrackingMetadata) {
  const event = this.emailEventRepo.create({...});
  this.eventQueue.push(event);
  
  // Batch insert every 100 events
  if (this.eventQueue.length >= 100) {
    await this.flushEvents();
  }
}

private async flushEvents() {
  await this.emailEventRepo.insert(this.eventQueue);
  this.eventQueue = [];
}
```

## Production Checklist

- [ ] Set TRACKING_DOMAIN to production domain
- [ ] Change TRACKING_SECRET from default
- [ ] Enable HTTPS on tracking domain
- [ ] Test tracking with multiple email clients
- [ ] Set up monitoring for tracking endpoints
- [ ] Configure CDN for pixel delivery
- [ ] Add bot detection
- [ ] Implement rate limiting
- [ ] Set up error alerting
- [ ] Document privacy policy
