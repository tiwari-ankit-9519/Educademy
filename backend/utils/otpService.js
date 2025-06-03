import crypto from "crypto";
import educademyLogger from "./logger.js";

class OTPService {
  constructor() {
    this.otpStorage = new Map();
  }

  generateOTP(length = 6) {
    const digits = "0123456789";
    let otp = "";

    for (let i = 0; i < length; i++) {
      otp += digits[crypto.randomInt(0, digits.length)];
    }

    return otp;
  }

  // Store OTP with expiration
  async storeOTP(email, otp, expiresInMinutes = 10) {
    const expiryTime = Date.now() + expiresInMinutes * 60 * 1000;
    const otpData = {
      otp,
      expiryTime,
      attempts: 0,
      maxAttempts: 3,
    };

    this.otpStorage.set(email, otpData);

    educademyLogger.info("OTP generated and stored", {
      email,
      expiresInMinutes,
      otpLength: otp.length,
      expiryTime: new Date(expiryTime).toISOString(),
    });

    // Auto cleanup after expiry
    setTimeout(() => {
      this.otpStorage.delete(email);
      educademyLogger.info("OTP automatically cleaned up", { email });
    }, expiresInMinutes * 60 * 1000 + 1000);

    return { otp, expiryTime };
  }

  // Verify OTP
  async verifyOTP(email, providedOTP) {
    const otpData = this.otpStorage.get(email);

    if (!otpData) {
      educademyLogger.warn("OTP verification failed - OTP not found", {
        email,
        providedOTP: providedOTP.substring(0, 2) + "****",
      });
      return { success: false, message: "OTP not found or expired" };
    }

    // Check expiry
    if (Date.now() > otpData.expiryTime) {
      this.otpStorage.delete(email);
      educademyLogger.warn("OTP verification failed - OTP expired", {
        email,
        expiredAt: new Date(otpData.expiryTime).toISOString(),
      });
      return { success: false, message: "OTP has expired" };
    }

    // Check attempts
    if (otpData.attempts >= otpData.maxAttempts) {
      this.otpStorage.delete(email);
      educademyLogger.security(
        "OTP max attempts exceeded",
        "HIGH",
        `Email: ${email}`,
        {
          email,
          attempts: otpData.attempts,
          maxAttempts: otpData.maxAttempts,
        }
      );
      return { success: false, message: "Maximum OTP attempts exceeded" };
    }

    // Verify OTP
    if (otpData.otp === providedOTP) {
      this.otpStorage.delete(email);
      educademyLogger.success("OTP verification successful", {
        email,
        attempts: otpData.attempts + 1,
      });
      return { success: true, message: "OTP verified successfully" };
    } else {
      // Increment attempts
      otpData.attempts += 1;
      this.otpStorage.set(email, otpData);

      educademyLogger.warn("OTP verification failed - incorrect OTP", {
        email,
        attempts: otpData.attempts,
        remainingAttempts: otpData.maxAttempts - otpData.attempts,
        providedOTP: providedOTP.substring(0, 2) + "****",
      });

      return {
        success: false,
        message: `Incorrect OTP. ${
          otpData.maxAttempts - otpData.attempts
        } attempts remaining`,
      };
    }
  }

  // Get OTP status (for debugging)
  getOTPStatus(email) {
    const otpData = this.otpStorage.get(email);
    if (!otpData) return null;

    return {
      exists: true,
      expired: Date.now() > otpData.expiryTime,
      attempts: otpData.attempts,
      remainingAttempts: otpData.maxAttempts - otpData.attempts,
      expiresAt: new Date(otpData.expiryTime).toISOString(),
    };
  }

  // Clean up expired OTPs (call periodically)
  cleanupExpiredOTPs() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [email, otpData] of this.otpStorage.entries()) {
      if (now > otpData.expiryTime) {
        this.otpStorage.delete(email);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      educademyLogger.info("Cleaned up expired OTPs", {
        cleanedCount,
        totalRemaining: this.otpStorage.size,
      });
    }
  }
}

// Create singleton instance
const otpService = new OTPService();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  otpService.cleanupExpiredOTPs();
}, 5 * 60 * 1000);

export default otpService;
