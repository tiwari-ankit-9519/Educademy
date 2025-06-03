import { config } from "dotenv";

import nodemailer from "nodemailer";
import educademyLogger from "./logger.js";
import { emailTemplates } from "./emailTemplates.js";

config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      const useTestService = process.env.USE_TEST_EMAIL === "true";

      if (useTestService && process.env.NODE_ENV === "development") {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        educademyLogger.info("Test email transporter created (Ethereal)", {
          service: "ethereal",
          testUser: testAccount.user,
          testPass: testAccount.pass,
          warning: "Using test email service - emails won't be delivered!",
        });
      } else {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
          throw new Error(
            "EMAIL_USER and EMAIL_PASSWORD environment variables are required"
          );
        }

        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          secure: true,
          port: 465,
        });

        educademyLogger.info("Gmail transporter created", {
          service: process.env.EMAIL_SERVICE || "gmail",
          user: process.env.EMAIL_USER,
          environment: process.env.NODE_ENV,
          note: "Real emails will be sent",
        });
      }

      await this.transporter.verify();
      educademyLogger.success("Email transporter verified successfully", {
        service: useTestService
          ? "ethereal"
          : process.env.EMAIL_SERVICE || "gmail",
        environment: process.env.NODE_ENV,
        realEmails: !useTestService,
      });
    } catch (error) {
      educademyLogger.error("Failed to initialize email transporter", error, {
        service: process.env.EMAIL_SERVICE,
        environment: process.env.NODE_ENV,
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPassword: !!process.env.EMAIL_PASSWORD,
      });
      throw error;
    }
  }

  async sendEmail({ to, subject, html, text, template, templateData }) {
    const startTime = performance.now();

    try {
      if (template && templateData) {
        html = emailTemplates[template](templateData);
        text = this.htmlToText(html);
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || "Educademy",
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        },
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      };

      educademyLogger.info("Sending email", {
        recipient: to,
        subject,
        template: template || "custom",
        fromName: mailOptions.from.name,
        fromAddress: mailOptions.from.address,
        environment: process.env.NODE_ENV,
      });

      const result = await this.transporter.sendMail(mailOptions);

      const previewUrl =
        process.env.USE_TEST_EMAIL === "true"
          ? nodemailer.getTestMessageUrl(result)
          : null;

      educademyLogger.info("SEND", to, true, {
        subject,
        template: template || "custom",
        messageId: result.messageId,
        previewUrl,
        isTestEmail: process.env.USE_TEST_EMAIL === "true",
      });

      educademyLogger.performance("EMAIL_SEND", startTime, {
        recipient: to,
        template: template || "custom",
      });

      return {
        success: true,
        messageId: result.messageId,
        previewUrl,
        deliveryInfo: {
          realEmail: process.env.USE_TEST_EMAIL !== "true",
          service: process.env.USE_TEST_EMAIL === "true" ? "ethereal" : "gmail",
          recipient: to,
        },
      };
    } catch (error) {
      educademyLogger.info("SEND", to, false, {
        subject,
        template: template || "custom",
        errorMessage: error.message,
        errorCode: error.code,
        errorName: error.name,
      });

      educademyLogger.error("Failed to send email", error, {
        recipient: to,
        subject,
        template: template || "custom",
        service: process.env.USE_TEST_EMAIL === "true" ? "ethereal" : "gmail",
      });

      return {
        success: false,
        error: error.message,
        errorCode: error.code,
      };
    }
  }

  // Send OTP verification email
  async sendOTPVerification({ email, firstName, otp, expiresIn = 10 }) {
    educademyLogger.info("Sending OTP verification email", {
      recipient: email,
      firstName,
      otpLength: otp.length,
      expiresInMinutes: expiresIn,
      isRegistrationFlow: true,
    });

    return await this.sendEmail({
      to: email,
      subject: "🔐 Verify Your Educademy Account - OTP Code Inside",
      template: "otpVerification",
      templateData: {
        firstName,
        otp,
        expiresIn,
        email,
      },
    });
  }

  // Send welcome email after successful verification
  async sendWelcomeEmail({ email, firstName, lastName }) {
    educademyLogger.info("Sending welcome email", {
      recipient: email,
      firstName,
      lastName,
      isWelcomeFlow: true,
    });

    return await this.sendEmail({
      to: email,
      subject: "🎉 Welcome to Educademy - Your Learning Journey Begins!",
      template: "welcome",
      templateData: {
        firstName,
        lastName,
        email,
      },
    });
  }

  // Send password reset OTP
  async sendPasswordResetOTP({ email, firstName, otp, expiresIn = 15 }) {
    educademyLogger.info("Sending password reset OTP", {
      recipient: email,
      firstName,
      expiresInMinutes: expiresIn,
      isPasswordResetFlow: true,
    });

    return await this.sendEmail({
      to: email,
      subject: "🔒 Reset Your Educademy Password - OTP Code",
      template: "passwordReset",
      templateData: {
        firstName,
        otp,
        expiresIn,
        email,
      },
    });
  }

  // Send login alert
  async sendLoginAlert({ email, firstName, loginInfo }) {
    educademyLogger.info("Sending login alert", {
      recipient: email,
      firstName,
      loginLocation: loginInfo.location,
      loginIP: loginInfo.ipAddress,
      isSecurityAlert: true,
    });

    return await this.sendEmail({
      to: email,
      subject: "🔔 New Login to Your Educademy Account",
      template: "loginAlert",
      templateData: {
        firstName,
        loginInfo,
      },
    });
  }

  // Test email functionality (development helper)
  async sendTestEmail(toEmail) {
    if (process.env.NODE_ENV === "production") {
      educademyLogger.warn("Test email blocked in production", {
        attemptedRecipient: toEmail,
      });
      return { success: false, error: "Test emails not allowed in production" };
    }

    educademyLogger.info("Sending test email", {
      recipient: toEmail,
      isTestEmail: true,
    });

    return await this.sendEmail({
      to: toEmail,
      subject: "🧪 Educademy Email Test",
      template: "otpVerification",
      templateData: {
        firstName: "Test User",
        otp: "123456",
        expiresIn: 10,
        email: toEmail,
      },
    });
  }

  // Convert HTML to plain text
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Get service status
  getServiceInfo() {
    return {
      service: process.env.USE_TEST_EMAIL === "true" ? "ethereal" : "gmail",
      environment: process.env.NODE_ENV,
      realEmails: process.env.USE_TEST_EMAIL !== "true",
      configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
    };
  }
}

// Create singleton instance
const emailService = new EmailService();
export default emailService;
