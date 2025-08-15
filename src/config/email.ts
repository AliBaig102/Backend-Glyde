import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

/**
 * Email configuration and service management
 */

interface EmailConfig {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

class EmailManager {
  private static instance: EmailManager;
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  private constructor() {
    this.isConfigured = false;
  }

  public static getInstance(): EmailManager {
    if (!EmailManager.instance) {
      EmailManager.instance = new EmailManager();
    }
    return EmailManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const config = this.getEmailConfig();

      if (!config.auth.user || !config.auth.pass) {
        logger.warn('Email service not configured - missing credentials');
        return;
      }

      this.transporter = nodemailer.createTransport(config);

      // Verify connection
      if (this.transporter) {
        await this.transporter.verify();
      }

      this.isConfigured = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Email service initialization failed:', error);
      this.isConfigured = false;
    }
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.transporter) {
        throw new Error('Email service not configured');
      }

      const config = this.getEmailConfig();

      const mailOptions = {
        from: config.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully:', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  public async sendWelcomeEmail(
    to: string,
    userName: string,
    verificationUrl?: string
  ): Promise<boolean> {
    const template = this.getWelcomeEmailTemplate(userName, verificationUrl);

    const emailOptions: EmailOptions = {
      to,
      subject: template.subject,
      html: template.html,
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    return await this.sendEmail(emailOptions);
  }

  public async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetUrl: string
  ): Promise<boolean> {
    const template = this.getPasswordResetEmailTemplate(userName, resetUrl);

    const emailOptions: EmailOptions = {
      to,
      subject: template.subject,
      html: template.html,
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    return await this.sendEmail(emailOptions);
  }

  public async sendEmailVerification(
    to: string,
    userName: string,
    verificationUrl: string
  ): Promise<boolean> {
    const template = this.getEmailVerificationTemplate(
      userName,
      verificationUrl
    );

    const emailOptions: EmailOptions = {
      to,
      subject: template.subject,
      html: template.html,
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    return await this.sendEmail(emailOptions);
  }

  public async sendPasswordChangeNotification(
    to: string,
    userName: string
  ): Promise<boolean> {
    const template = this.getPasswordChangeNotificationTemplate(userName);

    const emailOptions: EmailOptions = {
      to,
      subject: template.subject,
      html: template.html,
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    return await this.sendEmail(emailOptions);
  }

  public async sendAccountDeletionNotification(
    to: string,
    userName: string
  ): Promise<boolean> {
    const template = this.getAccountDeletionNotificationTemplate(userName);

    const emailOptions: EmailOptions = {
      to,
      subject: template.subject,
      html: template.html,
    };

    if (template.text) {
      emailOptions.text = template.text;
    }

    return await this.sendEmail(emailOptions);
  }

  public isEmailServiceConfigured(): boolean {
    return this.isConfigured;
  }

  private getEmailConfig(): EmailConfig {
    const emailService = process.env['EMAIL_SERVICE'];
    const emailHost = process.env['EMAIL_HOST'];
    const emailPort = process.env['EMAIL_PORT'];
    const emailSecure = process.env['EMAIL_SECURE'] === 'true';
    const emailUser = process.env['EMAIL_USER'] || '';
    const emailPass = process.env['EMAIL_PASS'] || '';
    const emailFrom = process.env['EMAIL_FROM'] || emailUser;

    // If using a service like Gmail, Outlook, etc.
    if (emailService) {
      return {
        service: emailService,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        from: emailFrom,
      };
    }

    // If using custom SMTP settings
    return {
      host: emailHost || 'localhost',
      port: emailPort ? parseInt(emailPort, 10) : 587,
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      from: emailFrom,
    };
  }

  private getWelcomeEmailTemplate(
    userName: string,
    verificationUrl?: string
  ): EmailTemplate {
    const appName = process.env['APP_NAME'] || 'Glyde';
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';

    const verificationSection = verificationUrl
      ? `
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${appName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff;">${appName}</h1>
        </div>
        
        <h2>Welcome, ${userName}!</h2>
        
        <p>Thank you for joining ${appName}! We're excited to have you as part of our community.</p>
        
        ${verificationSection}
        
        <p>If you have any questions or need assistance, feel free to contact our support team.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>Best regards,<br>The ${appName} Team</p>
          <p><a href="${frontendUrl}" style="color: #007bff;">${frontendUrl}</a></p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ${appName}, ${userName}!
      
      Thank you for joining ${appName}! We're excited to have you as part of our community.
      
      ${verificationUrl ? `Please verify your email address by visiting: ${verificationUrl}` : ''}
      
      If you have any questions or need assistance, feel free to contact our support team.
      
      Best regards,
      The ${appName} Team
      ${frontendUrl}
    `;

    return {
      subject: `Welcome to ${appName}!`,
      html,
      text,
    };
  }

  private getPasswordResetEmailTemplate(
    userName: string,
    resetUrl: string
  ): EmailTemplate {
    const appName = process.env['APP_NAME'] || 'Glyde';
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - ${appName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff;">${appName}</h1>
        </div>
        
        <h2>Password Reset Request</h2>
        
        <p>Hello ${userName},</p>
        
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
        
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>Best regards,<br>The ${appName} Team</p>
          <p><a href="${frontendUrl}" style="color: #007bff;">${frontendUrl}</a></p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - ${appName}
      
      Hello ${userName},
      
      We received a request to reset your password. Please visit the following link to create a new password:
      
      ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
      
      Best regards,
      The ${appName} Team
      ${frontendUrl}
    `;

    return {
      subject: `Password Reset - ${appName}`,
      html,
      text,
    };
  }

  private getEmailVerificationTemplate(
    userName: string,
    verificationUrl: string
  ): EmailTemplate {
    const appName = process.env['APP_NAME'] || 'Glyde';
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification - ${appName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff;">${appName}</h1>
        </div>
        
        <h2>Email Verification</h2>
        
        <p>Hello ${userName},</p>
        
        <p>Please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        
        <p><strong>This verification link will expire in 24 hours.</strong></p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>Best regards,<br>The ${appName} Team</p>
          <p><a href="${frontendUrl}" style="color: #007bff;">${frontendUrl}</a></p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Email Verification - ${appName}
      
      Hello ${userName},
      
      Please verify your email address by visiting the following link:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      Best regards,
      The ${appName} Team
      ${frontendUrl}
    `;

    return {
      subject: `Email Verification - ${appName}`,
      html,
      text,
    };
  }

  private getPasswordChangeNotificationTemplate(
    userName: string
  ): EmailTemplate {
    const appName = process.env['APP_NAME'] || 'Glyde';
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Changed - ${appName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff;">${appName}</h1>
        </div>
        
        <h2>Password Changed Successfully</h2>
        
        <p>Hello ${userName},</p>
        
        <p>This is to confirm that your password has been successfully changed.</p>
        
        <p>If you did not make this change, please contact our support team immediately.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>Best regards,<br>The ${appName} Team</p>
          <p><a href="${frontendUrl}" style="color: #007bff;">${frontendUrl}</a></p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Changed Successfully - ${appName}
      
      Hello ${userName},
      
      This is to confirm that your password has been successfully changed.
      
      If you did not make this change, please contact our support team immediately.
      
      Best regards,
      The ${appName} Team
      ${frontendUrl}
    `;

    return {
      subject: `Password Changed - ${appName}`,
      html,
      text,
    };
  }

  private getAccountDeletionNotificationTemplate(
    userName: string
  ): EmailTemplate {
    const appName = process.env['APP_NAME'] || 'Glyde';
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:3000';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Account Deleted - ${appName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff;">${appName}</h1>
        </div>
        
        <h2>Account Deletion Confirmation</h2>
        
        <p>Hello ${userName},</p>
        
        <p>This is to confirm that your account has been successfully deleted from ${appName}.</p>
        
        <p>All your data has been permanently removed from our systems.</p>
        
        <p>Thank you for being part of our community. We're sorry to see you go!</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
          <p>Best regards,<br>The ${appName} Team</p>
          <p><a href="${frontendUrl}" style="color: #007bff;">${frontendUrl}</a></p>
        </div>
      </body>
      </html>
    `;

    const text = `
      Account Deletion Confirmation - ${appName}
      
      Hello ${userName},
      
      This is to confirm that your account has been successfully deleted from ${appName}.
      
      All your data has been permanently removed from our systems.
      
      Thank you for being part of our community. We're sorry to see you go!
      
      Best regards,
      The ${appName} Team
      ${frontendUrl}
    `;

    return {
      subject: `Account Deleted - ${appName}`,
      html,
      text,
    };
  }
}

// Export singleton instance
export const emailManager = EmailManager.getInstance();

// Convenience functions
export const initializeEmail = () => emailManager.initialize();
export const sendEmail = (options: EmailOptions) =>
  emailManager.sendEmail(options);
export const sendWelcomeEmail = (
  to: string,
  userName: string,
  verificationUrl?: string
) => emailManager.sendWelcomeEmail(to, userName, verificationUrl);
export const sendPasswordResetEmail = (
  to: string,
  userName: string,
  resetUrl: string
) => emailManager.sendPasswordResetEmail(to, userName, resetUrl);
export const sendEmailVerification = (
  to: string,
  userName: string,
  verificationUrl: string
) => emailManager.sendEmailVerification(to, userName, verificationUrl);
export const sendPasswordChangeNotification = (to: string, userName: string) =>
  emailManager.sendPasswordChangeNotification(to, userName);
export const sendAccountDeletionNotification = (to: string, userName: string) =>
  emailManager.sendAccountDeletionNotification(to, userName);
