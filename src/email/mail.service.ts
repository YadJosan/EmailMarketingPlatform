import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const useMailtrap = this.config.get('USE_MAILTRAP') === 'true';

    if (useMailtrap) {
      // Mailtrap configuration for testing
      this.transporter = nodemailer.createTransport({
        host: this.config.get('MAILTRAP_HOST') || 'smtp.mailtrap.io',
        port: parseInt(this.config.get('MAILTRAP_PORT') || '2525'),
        auth: {
          user: this.config.get('MAILTRAP_USER'),
          pass: this.config.get('MAILTRAP_PASS'),
        },
      });
    } else {
      // Production SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: this.config.get('SMTP_HOST'),
        port: parseInt(this.config.get('SMTP_PORT') || '587'),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    }
  }

  private getFromEmail(): string {
    const useMailtrap = this.config.get('USE_MAILTRAP') === 'true';
    
    if (useMailtrap) {
      return this.config.get('MAILTRAP_FROM_EMAIL') || 'noreply@mailtrap.io';
    }
    
    return this.config.get('MAIL_FROM') || 'noreply@yourdomain.com';
  }

  async sendVerificationEmail(email: string, token: string, userName?: string) {
    const appUrl = this.config.get('APP_URL') || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: this.getFromEmail(),
      to: email,
      subject: 'Verify Your Email Address',
      html: this.getVerificationEmailTemplate(verificationUrl, userName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, userName?: string) {
    const mailOptions = {
      from: this.getFromEmail(),
      to: email,
      subject: 'Welcome to Email Marketing Platform!',
      html: this.getWelcomeEmailTemplate(userName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const appUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3001';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: this.getFromEmail(),
      to: email,
      subject: 'Reset Your Password',
      html: this.getPasswordResetTemplate(resetUrl),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  private getVerificationEmailTemplate(verificationUrl: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Email Marketing Platform</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
          
          ${userName ? `<p>Hi ${userName},</p>` : '<p>Hi there,</p>'}
          
          <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 Email Marketing Platform. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Welcome!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          ${userName ? `<h2 style="color: #333; margin-top: 0;">Hi ${userName}!</h2>` : '<h2 style="color: #333; margin-top: 0;">Hi there!</h2>'}
          
          <p>Welcome to Email Marketing Platform! We're excited to have you on board.</p>
          
          <h3 style="color: #667eea;">Get Started:</h3>
          <ul style="line-height: 2;">
            <li>Create your first workspace</li>
            <li>Import your contacts</li>
            <li>Design beautiful email campaigns</li>
            <li>Track your results</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.config.get('FRONTEND_URL') || 'http://localhost:3001'}/dashboard" 
               style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Need help? Check out our documentation or contact support.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 Email Marketing Platform. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Reset Your Password</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2025 Email Marketing Platform. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }
}
