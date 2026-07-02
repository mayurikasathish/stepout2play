const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter
   */
  init() {
    if (this.initialized) return;

    // Check if email is configured
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email configuration not found. Email notifications will be skipped.');
      this.initialized = true;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      this.initialized = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.initialized = true; // Mark as initialized to prevent repeated attempts
    }
  }

  /**
   * Send an email
   */
  async sendEmail({ to, subject, html, text }) {
    this.init();

    if (!this.transporter) {
      console.log('Email not configured. Skipping email to:', to);
      return { skipped: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'StepOut2Play'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send standby promotion notification
   */
  async sendStandbyPromotionEmail({ to, userName, eventName, tournamentName, acceptUrl, standbyPosition }) {
    const subject = `🎾 Spot Available: ${eventName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #059669; }
          .warning { color: #dc2626; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎾 A Spot Has Opened Up!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>

            <p>Great news! A confirmed player has withdrawn from <strong>${eventName}</strong> in the <strong>${tournamentName}</strong> tournament.</p>

            <div class="highlight-box">
              <p style="margin: 0;"><strong>⚡ Quick Action Required!</strong></p>
              <p style="margin: 5px 0 0 0;">You were #${standbyPosition} on the waitlist. All standby players have been notified, and the <strong>first person to accept gets the spot</strong>.</p>
            </div>

            <p class="warning">⏰ Time Sensitive: This spot will go to the first person who accepts!</p>

            <center>
              <a href="${acceptUrl}" class="button">VIEW PROMOTION</a>
            </center>

            <p style="margin-top: 30px;">If you're no longer interested, no action is needed. The spot will automatically go to someone else who accepts.</p>

            <p>Best of luck!</p>
            <p><strong>Team StepOut2Play</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated notification from StepOut2Play</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${userName},

A spot has opened up for ${eventName} in the ${tournamentName} tournament!

You were #${standbyPosition} on the waitlist. All standby players have been notified, and the first person to accept gets the spot.

Click here to accept: ${acceptUrl}

⚠️ Time sensitive: The first person to accept gets the spot!

If you're no longer interested, no action is needed.

Best of luck!
Team StepOut2Play
    `;

    return await this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send withdrawal notification to organizers
   */
  async sendWithdrawalNotification({ to, playerName, eventName, tournamentName, reason }) {
    const subject = `⚠️ Player Withdrawal: ${eventName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
          .info-box { background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ Player Withdrawal Alert</h2>
          </div>
          <div class="content">
            <p>A player has withdrawn from your tournament.</p>

            <div class="info-box">
              <p><strong>Player:</strong> ${playerName}</p>
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Tournament:</strong> ${tournamentName}</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>

            <p>If there are standby players and the replacement window is still open, they have been automatically notified.</p>

            <p>You can view and manage registrations from your tournament dashboard.</p>

            <p><strong>Team StepOut2Play</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated notification from StepOut2Play</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Player Withdrawal Alert

A player has withdrawn from your tournament.

Player: ${playerName}
Event: ${eventName}
Tournament: ${tournamentName}
${reason ? `Reason: ${reason}` : ''}

If there are standby players and the replacement window is still open, they have been automatically notified.

Team StepOut2Play
    `;

    return await this.sendEmail({ to, subject, html, text });
  }

  /**
   * Send confirmation email when standby player accepts
   */
  async sendSpotConfirmationEmail({ to, userName, eventName, tournamentName }) {
    const subject = `✅ Confirmed: ${eventName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>

            <div class="success-box">
              <p style="margin: 0;"><strong>✅ Registration Confirmed</strong></p>
              <p style="margin: 5px 0 0 0;">You've been promoted from the waitlist to a confirmed participant!</p>
            </div>

            <p><strong>Event:</strong> ${eventName}</p>
            <p><strong>Tournament:</strong> ${tournamentName}</p>

            <p>You can view all your tournament registrations and match schedules in the "My Matches" section.</p>

            <p>See you at the tournament!</p>
            <p><strong>Team StepOut2Play</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated confirmation from StepOut2Play</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Congratulations ${userName}!

You've been promoted from the waitlist to a confirmed participant!

Event: ${eventName}
Tournament: ${tournamentName}

You can view all your tournament registrations and match schedules in the "My Matches" section.

See you at the tournament!
Team StepOut2Play
    `;

    return await this.sendEmail({ to, subject, html, text });
  }
}

module.exports = new EmailService();
