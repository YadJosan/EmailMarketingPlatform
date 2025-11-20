import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { MailService } from '../email/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signup(email: string, password: string) {
    // Check if user already exists
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }
    // Create new user with email verification

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const user = this.userRepo.create({ 
      email, 
      passwordHash,
      provider: 'local',
      verificationToken,
      emailVerified: false,
    });
    
    await this.userRepo.save(user);

    // Send verification email
    try {
      await this.mailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail signup if email fails
    }

    // Return success message instead of token
    return {
      message: 'Account created successfully! Please check your email to verify your account.',
      email: user.email,
      emailVerified: false,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({ where: { verificationToken: token } });
    
    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.emailVerified = true;
    user.verificationToken = null;
    await this.userRepo.save(user);

    // Send welcome email
    try {
      await this.mailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return { 
      message: 'Email verified successfully! You can now log in.',
      email: user.email,
    };
  }

  async resendVerification(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await this.userRepo.save(user);

    await this.mailService.sendVerificationEmail(email, verificationToken, user.firstName);

    return { message: 'Verification email sent' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account exists with this email, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now
    await this.userRepo.save(user);

    // Send reset email
    try {
      await this.mailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    return { message: 'If an account exists with this email, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findOne({ 
      where: { resetPasswordToken: token } 
    });
    
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepo.save(user);

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    return this.generateToken(user);
  }

  async googleLogin(googleUser: any) {
    // Check if user exists
    let user = await this.userRepo.findOne({ 
      where: [
        { googleId: googleUser.googleId },
        { email: googleUser.email }
      ]
    });

    if (!user) {
      // Create new user
      user = this.userRepo.create({
        email: googleUser.email,
        googleId: googleUser.googleId,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        picture: googleUser.picture,
        provider: 'google',
        emailVerified: true,
      });
      await this.userRepo.save(user);

      // Send welcome email
      try {
        await this.mailService.sendWelcomeEmail(user.email, user.firstName);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    } else if (!user.googleId) {
      // Link existing account with Google
      user.googleId = googleUser.googleId;
      user.firstName = googleUser.firstName;
      user.lastName = googleUser.lastName;
      user.picture = googleUser.picture;
      user.emailVerified = true;
      await this.userRepo.save(user);
    }

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { 
        id: user.id, 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        emailVerified: user.emailVerified,
      },
    };
  }
}
