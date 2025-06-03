import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import passport from "passport";
import educademyLogger from "../utils/logger.js";
import emailService from "../utils/emailService.js";
import otpService from "../utils/otpService.js";
import { uploadImage, deleteFromCloudinary } from "../config/upload.js";
import { performance } from "perf_hooks";
import { v2 as cloudinary } from "cloudinary";
import getTokenFromHeader from "../utils/getTokenFromHeader.js";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
    {
      emit: "event",
      level: "info",
    },
    {
      emit: "event",
      level: "warn",
    },
  ],
  errorFormat: "pretty",
});

prisma.$on("query", (e) => {
  // Add this debug line to see complete queries in console
  console.log("🔍 FULL SQL:", e.query);
  console.log("📋 PARAMS:", e.params);
  console.log("⏱️ DURATION:", e.duration + "ms");
  console.log("---");

  const queryLower = (e.query || "").toLowerCase().trim();
  let tableName = "unknown";
  let operation = "QUERY";

  // Parse operation and table name
  if (queryLower.includes("select")) {
    operation = "SELECT";
    const fromMatch =
      queryLower.match(/from\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/from\s+"?(\w+)"?/i);
    if (fromMatch) {
      tableName = fromMatch[2] || fromMatch[1];
    }
  } else if (queryLower.includes("insert")) {
    operation = "INSERT";
    const intoMatch =
      queryLower.match(/insert\s+into\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/insert\s+into\s+"?(\w+)"?/i);
    if (intoMatch) {
      tableName = intoMatch[2] || intoMatch[1];
    }
  } else if (queryLower.includes("update")) {
    operation = "UPDATE";
    const updateMatch =
      queryLower.match(/update\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/update\s+"?(\w+)"?/i);
    if (updateMatch) {
      tableName = updateMatch[2] || updateMatch[1];
    }
  } else if (queryLower.includes("delete")) {
    operation = "DELETE";
    const deleteMatch =
      queryLower.match(/delete\s+from\s+"?(\w+)"?\."?(\w+)"?/i) ||
      queryLower.match(/delete\s+from\s+"?(\w+)"?/i);
    if (deleteMatch) {
      tableName = deleteMatch[2] || deleteMatch[1];
    }
  }

  // Log using INFO level (which works) instead of QUERY level
  educademyLogger.logger.log("info", `DATABASE ${operation}: ${tableName}`, {
    sqlQuery: e.query,
    sqlParams: e.params,
    database: {
      operation: operation.toUpperCase(),
      table: tableName,
      duration: e.duration ? `${e.duration}ms` : null,
    },
  });
});

const createUserProfile = async (userId, role) => {
  const startTime = performance.now();

  educademyLogger.logMethodEntry("AuthController", "createUserProfile", {
    userId,
    role,
  });

  try {
    let profileData;

    switch (role) {
      case "STUDENT":
        profileData = await prisma.student.create({
          data: {
            userId,
            learningGoals: [],
            interests: [],
            skillLevel: "BEGINNER",
            totalLearningTime: 0,
          },
        });
        break;

      case "INSTRUCTOR":
        profileData = await prisma.instructor.create({
          data: {
            userId,
            title: null,
            expertise: [],
            rating: null,
            totalStudents: 0,
            totalCourses: 0,
            totalRevenue: 0,
            yearsExperience: null,
            education: null,
            certifications: [],
            isVerified: false,
            verificationBadge: null,
            biography: null,
            paymentDetails: null,
            commissionRate: 0.7,
          },
        });
        break;

      case "ADMIN":
        profileData = await prisma.admin.create({
          data: {
            userId,
            permissions: [],
            resolvedLogs: [],
            department: null,
          },
        });
        break;

      default:
        throw new Error(`Invalid role: ${role}`);
    }

    educademyLogger.logBusinessOperation(
      "CREATE_USER_PROFILE",
      "USER_PROFILE",
      userId,
      "SUCCESS",
      { role, profileId: profileData?.id }
    );

    educademyLogger.logMethodExit(
      "AuthController",
      "createUserProfile",
      true,
      performance.now() - startTime
    );

    return profileData;
  } catch (error) {
    educademyLogger.error("Failed to create user profile", error, {
      userId,
      role,
      business: {
        operation: "CREATE_USER_PROFILE",
        entity: "USER_PROFILE",
        entityId: userId,
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "createUserProfile",
      false,
      performance.now() - startTime
    );

    throw error;
  }
};

export const loginUser = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { email, password } = req.body;

  educademyLogger.setContext({
    requestId,
    userId: null,
    sessionId: req.sessionID,
    className: "AuthController",
    methodName: "loginUser",
  });

  educademyLogger.logMethodEntry("AuthController", "loginUser", {
    email,
    hasPassword: !!password,
    clientIp: req.ip,
    userAgent: req.get("User-Agent"),
  });

  try {
    if (!email || !password) {
      educademyLogger.logValidationError(
        "email_or_password",
        { email, password: !!password },
        "Email and password are required",
        {
          request: { body: req.body },
          clientIp: req.ip,
        }
      );
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    educademyLogger.logBusinessOperation(
      "USER_AUTHENTICATION",
      "USER",
      null,
      "STARTED",
      { email: normalizedEmail, loginAttempt: true }
    );

    // OPTIMIZATION 1: Simplified user lookup - only essential fields for authentication
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        passwordHash: true,
        role: true,
        profileImage: true,
        bio: true,
        isVerified: true,
        isActive: true,
        timezone: true,
        language: true,
        country: true,
        phoneNumber: true,
        dateOfBirth: true,
        website: true,
        linkedinProfile: true,
        twitterProfile: true,
        githubProfile: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user) {
      educademyLogger.setContext({
        requestId,
        userId: user.id,
        sessionId: req.sessionID,
        className: "AuthController",
        methodName: "loginUser",
      });
    }

    if (!user) {
      educademyLogger.logBusinessOperation(
        "USER_LOOKUP",
        "USER",
        null,
        "NOT_FOUND",
        { email: normalizedEmail, reason: "User does not exist" }
      );

      educademyLogger.auth("LOGIN", false, null, {
        reason: "User not found",
        email: normalizedEmail,
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Account status checks
    if (!user.isActive) {
      educademyLogger.auth("LOGIN", false, user, {
        reason: "Account deactivated",
      });

      return res.status(401).json({
        success: false,
        message: "Account has been deactivated. Please contact support.",
      });
    }

    if (!user.isVerified) {
      const otp = otpService.generateOTP();
      await otpService.storeOTP(normalizedEmail, otp, 10);

      // Fire and forget email sending (don't wait for it)
      emailService
        .sendOTPVerification({
          email: normalizedEmail,
          firstName: user.firstName,
          otp,
          expiresIn: 10,
        })
        .catch((err) => {
          educademyLogger.error("Failed to send OTP email", err);
        });

      return res.status(403).json({
        success: false,
        message: "Please verify your email first. A new OTP has been sent.",
        needsVerification: true,
        userId: user.id,
      });
    }

    // Password verification
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      educademyLogger.auth("LOGIN", false, user, {
        reason: "Invalid password",
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // OPTIMIZATION 2: Run parallel operations for non-critical updates
    const parallelOperations = [
      // Update last login
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      }),

      // Create session
      prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          device: req.get("User-Agent")?.substring(0, 255),
          ipAddress: req.ip,
        },
      }),
    ];

    const [updatedUser, session] = await Promise.all(parallelOperations);

    // OPTIMIZATION 3: Send login alert asynchronously (don't wait)
    const loginInfo = {
      timestamp: new Date().toISOString(),
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      location: req.get("CF-IPCountry") || "Unknown",
    };

    emailService
      .sendLoginAlert({
        email: user.email,
        firstName: user.firstName,
        loginInfo,
      })
      .catch((err) => {
        educademyLogger.error("Failed to send login alert", err);
      });

    // OPTIMIZATION 4: Basic response without heavy profile data
    // Profile data will be loaded separately via dedicated API endpoints
    const endTime = performance.now();
    educademyLogger.performance("USER_LOGIN", startTime, {
      userId: user.id,
      authenticationMethod: "bcrypt",
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "loginUser",
      true,
      endTime - startTime
    );

    // FAST RESPONSE - Essential user data only
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        isVerified: user.isVerified,
        isActive: user.isActive,
        timezone: user.timezone,
        language: user.language,
        country: user.country,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        website: user.website,
        linkedinProfile: user.linkedinProfile,
        twitterProfile: user.twitterProfile,
        githubProfile: user.githubProfile,
        lastLogin: updatedUser.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Profile and dashboard stats will be loaded via separate endpoints
        needsProfileData: true, // Flag to indicate client should load profile data
      },
    });
  } catch (error) {
    educademyLogger.error("LOGIN_ERROR", error, {
      business: {
        operation: "USER_AUTHENTICATION",
        entity: "USER",
        status: "ERROR",
      },
      request: {
        body: req.body,
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    const endTime = performance.now();
    educademyLogger.logMethodExit(
      "AuthController",
      "loginUser",
      false,
      endTime - startTime
    );

    res.status(500).json({
      success: false,
      message: "Internal server error",
      requestId: requestId,
    });
  }
});

export const registerUser = asyncHandler(async (req, res) => {
  uploadImage.single("profileImage")(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError(
        "profileImage",
        req.file,
        err.message,
        {
          requestId: req.headers["x-request-id"],
        }
      );
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    const { firstName, lastName, email, password, role = "STUDENT" } = req.body;
    const profileImage = req.file?.path || null;

    educademyLogger.setContext({
      requestId,
      className: "AuthController",
      methodName: "registerUser",
    });

    educademyLogger.logMethodEntry("AuthController", "registerUser", {
      email,
      role,
      hasPassword: !!password,
      hasProfileImage: !!profileImage,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    try {
      if (!firstName || !lastName || !email || !password) {
        if (profileImage && req.file?.filename) {
          await deleteFromCloudinary(req.file.filename);
        }

        const missingFields = {
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          password: !password,
        };

        Object.entries(missingFields).forEach(([field, isMissing]) => {
          if (isMissing) {
            educademyLogger.logValidationError(
              field,
              null,
              "Field is required",
              {
                email,
                operation: "USER_REGISTRATION",
              }
            );
          }
        });

        educademyLogger.logBusinessOperation(
          "USER_REGISTRATION",
          "USER",
          null,
          "VALIDATION_FAILED",
          { missingFields, email }
        );

        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (profileImage && req.file?.filename) {
          await deleteFromCloudinary(req.file.filename);
        }

        educademyLogger.logValidationError(
          "email",
          email,
          "Invalid email format",
          {
            operation: "USER_REGISTRATION",
          }
        );

        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      if (password.length < 8) {
        if (profileImage && req.file?.filename) {
          await deleteFromCloudinary(req.file.filename);
        }

        educademyLogger.logValidationError(
          "password",
          password,
          "Password too short",
          {
            passwordLength: password.length,
            operation: "USER_REGISTRATION",
          }
        );

        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters long",
        });
      }

      const normalizedEmail = email.toLowerCase();

      educademyLogger.info("Checking for existing user", {
        business: {
          operation: "USER_LOOKUP",
          entity: "USER",
          status: "CHECKING_DUPLICATE",
        },
        database: {
          operation: "SELECT",
          table: "users",
          lookupField: "email",
        },
      });

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        if (profileImage && req.file?.filename) {
          await deleteFromCloudinary(req.file.filename);
        }

        if (existingUser.isVerified) {
          educademyLogger.logBusinessOperation(
            "USER_REGISTRATION",
            "USER",
            existingUser.id,
            "DUPLICATE_EMAIL",
            { email: normalizedEmail, isVerified: true }
          );

          return res.status(400).json({
            success: false,
            message: "User with this email already exists",
          });
        } else {
          const otp = otpService.generateOTP();
          await otpService.storeOTP(normalizedEmail, otp, 10);

          const emailResult = await emailService.sendOTPVerification({
            email: normalizedEmail,
            firstName: existingUser.firstName,
            otp,
            expiresIn: 10,
          });

          educademyLogger.logBusinessOperation(
            "RESEND_OTP",
            "USER",
            existingUser.id,
            "SUCCESS",
            { email: normalizedEmail, emailSent: emailResult.success }
          );

          return res.status(200).json({
            success: true,
            message:
              "Account exists but not verified. New OTP has been sent to your email.",
            userId: existingUser.id,
            needsVerification: true,
          });
        }
      }

      educademyLogger.info("Creating new user account", {
        business: {
          operation: "USER_CREATION",
          entity: "USER",
          status: "CREATING",
        },
        database: {
          operation: "INSERT",
          table: "users",
        },
      });

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          salt,
          role,
          profileImage,
          isVerified: false,
          isActive: true,
        },
      });

      educademyLogger.setContext({
        requestId,
        userId: user.id,
        className: "AuthController",
        methodName: "registerUser",
      });

      educademyLogger.logBusinessOperation(
        "USER_REGISTRATION",
        "USER",
        user.id,
        "SUCCESS",
        {
          email: normalizedEmail,
          role,
          hasProfileImage: !!profileImage,
        }
      );

      await createUserProfile(user.id, role);

      const otp = otpService.generateOTP();
      await otpService.storeOTP(normalizedEmail, otp, 10);

      const emailResult = await emailService.sendOTPVerification({
        email: normalizedEmail,
        firstName,
        otp,
        expiresIn: 10,
      });

      educademyLogger.logBusinessOperation(
        "SEND_VERIFICATION_OTP",
        "EMAIL",
        user.id,
        emailResult.success ? "SUCCESS" : "FAILED",
        { email: normalizedEmail, otpExpiry: 10 }
      );

      educademyLogger.auth("REGISTER", true, user, {
        emailSent: emailResult.success,
        role,
        hasProfileImage: !!profileImage,
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      });

      educademyLogger.logAuditTrail(
        "USER_REGISTRATION",
        "USER",
        user.id,
        null,
        "REGISTERED",
        user.id
      );

      educademyLogger.performance("USER_REGISTRATION", startTime, {
        userId: user.id,
        totalQueries: 3,
        profileCreated: true,
        otpSent: emailResult.success,
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "registerUser",
        true,
        performance.now() - startTime
      );

      res.status(201).json({
        success: true,
        message:
          "Registration successful! Please check your email for OTP verification.",
        userId: user.id,
        needsVerification: true,
        emailSent: emailResult.success,
        profileImage: user.profileImage,
      });
    } catch (error) {
      if (profileImage && req.file?.filename) {
        await deleteFromCloudinary(req.file.filename);
      }

      educademyLogger.error("Registration failed", error, {
        email,
        business: {
          operation: "USER_REGISTRATION",
          entity: "USER",
          status: "ERROR",
        },
        request: {
          body: req.body,
          clientIp: req.ip,
          userAgent: req.get("User-Agent"),
        },
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "registerUser",
        false,
        performance.now() - startTime
      );

      res.status(500).json({
        success: false,
        message: "Registration failed. Please try again.",
        requestId: requestId,
      });
    }
  });
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { email, otp } = req.body;

  educademyLogger.setContext({
    requestId,
    className: "AuthController",
    methodName: "verifyOTP",
  });

  educademyLogger.logMethodEntry("AuthController", "verifyOTP", {
    email,
    hasOtp: !!otp,
    clientIp: req.ip,
    userAgent: req.get("User-Agent"),
  });

  if (!email || !otp) {
    educademyLogger.logValidationError(
      "email_or_otp",
      { email, otp },
      "Email and OTP are required",
      {
        operation: "VERIFY_OTP",
      }
    );
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    educademyLogger.info("Verifying OTP", {
      business: {
        operation: "OTP_VERIFICATION",
        entity: "OTP",
        status: "VERIFYING",
      },
    });

    const otpResult = await otpService.verifyOTP(normalizedEmail, otp);

    if (!otpResult.success) {
      educademyLogger.logBusinessOperation(
        "VERIFY_OTP",
        "OTP",
        null,
        "FAILED",
        {
          email: normalizedEmail,
          reason: otpResult.message,
        }
      );

      educademyLogger.logSecurityEvent("OTP_VERIFICATION_FAILED", "MEDIUM", {
        email: normalizedEmail,
        reason: otpResult.message,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: otpResult.message,
      });
    }

    educademyLogger.info("Finding user for verification", {
      business: {
        operation: "USER_LOOKUP",
        entity: "USER",
        status: "FINDING_FOR_VERIFICATION",
      },
      database: {
        operation: "SELECT",
        table: "users",
        lookupField: "email",
      },
    });

    // Updated to only update isVerified field - removed non-existent fields
    const user = await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        isVerified: true,
        // Removed verificationCode and verificationExpires as they don't exist in your schema
      },
    });

    educademyLogger.setContext({
      requestId,
      userId: user.id,
      className: "AuthController",
      methodName: "verifyOTP",
    });

    educademyLogger.logBusinessOperation(
      "VERIFY_USER_EMAIL",
      "USER",
      user.id,
      "SUCCESS",
      { email: normalizedEmail }
    );

    educademyLogger.logAuditTrail(
      "EMAIL_VERIFICATION",
      "USER",
      user.id,
      false,
      true,
      user.id
    );

    educademyLogger.logSecurityEvent(
      "EMAIL_VERIFICATION_SUCCESS",
      "INFO",
      {
        userId: user.id,
        email: normalizedEmail,
        ip: req.ip,
      },
      user.id
    );

    const welcomeEmailResult = await emailService.sendWelcomeEmail({
      email: normalizedEmail,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    educademyLogger.logBusinessOperation(
      "SEND_WELCOME_EMAIL",
      "EMAIL",
      user.id,
      welcomeEmailResult.success ? "SUCCESS" : "FAILED",
      { email: normalizedEmail }
    );

    educademyLogger.auth("VERIFY_OTP", true, user, {
      welcomeEmailSent: welcomeEmailResult.success,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    educademyLogger.performance("VERIFY_OTP", startTime, {
      userId: user.id,
      totalQueries: 1,
      welcomeEmailSent: welcomeEmailResult.success,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "verifyOTP",
      true,
      performance.now() - startTime
    );

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Welcome to Educademy.",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
      },
      token: token,
    });
  } catch (error) {
    educademyLogger.error("OTP verification failed", error, {
      email: normalizedEmail,
      business: {
        operation: "VERIFY_OTP",
        entity: "USER",
        status: "ERROR",
      },
      request: {
        body: req.body,
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    educademyLogger.logSecurityEvent("OTP_VERIFICATION_ERROR", "HIGH", {
      email: normalizedEmail,
      error: error.message,
      ip: req.ip,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "verifyOTP",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
      requestId: requestId,
    });
  }
});

export const updateProfileImage = asyncHandler(async (req, res) => {
  uploadImage.single("profileImage")(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError(
        "profileImage",
        req.file,
        err.message,
        {
          userId: req.userAuthId,
          requestId: req.headers["x-request-id"],
        }
      );
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    educademyLogger.setContext({
      requestId,
      userId: req.userAuthId,
      className: "AuthController",
      methodName: "updateProfileImage",
    });

    educademyLogger.logMethodEntry("AuthController", "updateProfileImage", {
      userId: req.userAuthId,
      hasFile: !!req.file,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    try {
      if (!req.file) {
        educademyLogger.logValidationError(
          "profileImage",
          null,
          "Profile image is required",
          {
            operation: "UPDATE_PROFILE_IMAGE",
          }
        );
        return res.status(400).json({
          success: false,
          message: "Profile image is required",
        });
      }

      educademyLogger.info("Finding user for profile image update", {
        business: {
          operation: "USER_LOOKUP",
          entity: "USER",
          entityId: req.userAuthId, // ✅ Use req.userAuthId consistently
          status: "FINDING",
        },
        database: {
          operation: "SELECT",
          table: "users",
          lookupField: "id",
        },
      });

      const user = await prisma.user.findUnique({
        where: { id: req.userAuthId }, // ✅ Use req.userAuthId instead of req.user.id
      });

      if (!user) {
        await deleteFromCloudinary(req.file.filename);
        educademyLogger.error("User not found for profile image update", null, {
          userId: req.userAuthId, // ✅ Use req.userAuthId consistently
          business: {
            operation: "UPDATE_PROFILE_IMAGE",
            entity: "USER",
            entityId: req.userAuthId, // ✅ Use req.userAuthId consistently
            status: "USER_NOT_FOUND",
          },
        });

        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      educademyLogger.logBusinessOperation(
        "USER_LOOKUP",
        "USER",
        user.id,
        "SUCCESS",
        { hasCurrentImage: !!user.profileImage }
      );

      if (user.profileImage) {
        try {
          const publicId = user.profileImage.split("/").pop().split(".")[0];
          await deleteFromCloudinary(`educademy/profiles/${publicId}`);

          educademyLogger.logBusinessOperation(
            "DELETE_OLD_PROFILE_IMAGE",
            "PROFILE_IMAGE",
            user.id,
            "SUCCESS",
            { oldImageUrl: user.profileImage }
          );
        } catch (deleteError) {
          educademyLogger.warn("Failed to delete old profile image", {
            error: deleteError,
            userId: user.id,
            oldImageUrl: user.profileImage,
          });
        }
      }

      educademyLogger.info("Updating user profile image", {
        business: {
          operation: "USER_UPDATE",
          entity: "USER",
          entityId: req.userAuthId, // ✅ Use req.userAuthId consistently
          status: "UPDATING",
        },
        database: {
          operation: "UPDATE",
          table: "users",
        },
      });

      const updatedUser = await prisma.user.update({
        where: { id: req.userAuthId }, // ✅ Use req.userAuthId instead of req.user.id
        data: { profileImage: req.file.path },
        // ✅ Include additional fields to return complete user object
        include: {
          studentProfile: true,
          instructorProfile: true,
          adminProfile: true,
          notificationSettings: true,
        },
      });

      educademyLogger.logBusinessOperation(
        "UPDATE_PROFILE_IMAGE",
        "USER",
        user.id,
        "SUCCESS",
        {
          oldImage: user.profileImage,
          newImage: req.file.path,
        }
      );

      educademyLogger.logAuditTrail(
        "UPDATE_PROFILE_IMAGE",
        "USER",
        user.id,
        user.profileImage,
        req.file.path,
        req.userAuthId // ✅ Use req.userAuthId consistently
      );

      educademyLogger.performance("UPDATE_PROFILE_IMAGE", startTime, {
        userId: user.id,
        totalQueries: 2,
        imageUpdated: true,
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "updateProfileImage",
        true,
        performance.now() - startTime
      );

      // ✅ Return both profileImage and full user object for frontend
      res.status(200).json({
        success: true,
        message: "Profile image updated successfully",
        profileImage: updatedUser.profileImage,
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          role: updatedUser.role,
          profileImage: updatedUser.profileImage,
          bio: updatedUser.bio,
          isVerified: updatedUser.isVerified,
          isActive: updatedUser.isActive,
          timezone: updatedUser.timezone,
          language: updatedUser.language,
          country: updatedUser.country,
          phoneNumber: updatedUser.phoneNumber,
          dateOfBirth: updatedUser.dateOfBirth,
          website: updatedUser.website,
          linkedinProfile: updatedUser.linkedinProfile,
          twitterProfile: updatedUser.twitterProfile,
          githubProfile: updatedUser.githubProfile,
          lastLogin: updatedUser.lastLogin,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          profile:
            updatedUser.role === "STUDENT"
              ? updatedUser.studentProfile
              : updatedUser.role === "INSTRUCTOR"
              ? updatedUser.instructorProfile
              : updatedUser.adminProfile,
          notificationSettings: updatedUser.notificationSettings,
        },
      });
    } catch (error) {
      if (req.file?.filename) {
        await deleteFromCloudinary(req.file.filename);
      }

      educademyLogger.error("Profile image update failed", error, {
        userId: req.userAuthId,
        business: {
          operation: "UPDATE_PROFILE_IMAGE",
          entity: "USER",
          entityId: req.userAuthId,
          status: "ERROR",
        },
        request: {
          clientIp: req.ip,
          userAgent: req.get("User-Agent"),
        },
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "updateProfileImage",
        false,
        performance.now() - startTime
      );

      res.status(500).json({
        success: false,
        message: "Failed to update profile image",
        requestId: requestId,
      });
    }
  });
});

export const removeProfileImage = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AuthController",
    methodName: "removeProfileImage",
  });

  educademyLogger.logMethodEntry("AuthController", "removeProfileImage", {
    userId: req.userAuthId,
    clientIp: req.ip,
    userAgent: req.get("User-Agent"),
  });

  try {
    educademyLogger.info("Finding user for profile image removal", {
      business: {
        operation: "USER_LOOKUP",
        entity: "USER",
        entityId: req.user.id,
        status: "FINDING",
      },
      database: {
        operation: "SELECT",
        table: "users",
        lookupField: "id",
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      educademyLogger.error("User not found for profile image removal", null, {
        userId: req.user.id,
        business: {
          operation: "REMOVE_PROFILE_IMAGE",
          entity: "USER",
          entityId: req.user.id,
          status: "USER_NOT_FOUND",
        },
      });

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    educademyLogger.logBusinessOperation(
      "USER_LOOKUP",
      "USER",
      user.id,
      "SUCCESS",
      { hasCurrentImage: !!user.profileImage }
    );

    if (user.profileImage) {
      try {
        const publicId = user.profileImage.split("/").pop().split(".")[0];
        await deleteFromCloudinary(`educademy/profiles/${publicId}`);

        educademyLogger.logBusinessOperation(
          "DELETE_PROFILE_IMAGE_CLOUDINARY",
          "PROFILE_IMAGE",
          user.id,
          "SUCCESS",
          { deletedImageUrl: user.profileImage }
        );
      } catch (deleteError) {
        educademyLogger.warn("Failed to delete profile image from Cloudinary", {
          error: deleteError,
          userId: user.id,
          imageUrl: user.profileImage,
        });
      }
    }

    educademyLogger.info("Removing profile image from database", {
      business: {
        operation: "USER_UPDATE",
        entity: "USER",
        entityId: req.user.id,
        status: "UPDATING",
      },
      database: {
        operation: "UPDATE",
        table: "users",
      },
    });

    await prisma.user.update({
      where: { id: req.user.id },
      data: { profileImage: null },
    });

    educademyLogger.logBusinessOperation(
      "REMOVE_PROFILE_IMAGE",
      "USER",
      user.id,
      "SUCCESS",
      { removedImageUrl: user.profileImage }
    );

    educademyLogger.logAuditTrail(
      "REMOVE_PROFILE_IMAGE",
      "USER",
      user.id,
      user.profileImage,
      null,
      req.user.id
    );

    educademyLogger.performance("REMOVE_PROFILE_IMAGE", startTime, {
      userId: user.id,
      totalQueries: 2,
      imageRemoved: true,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "removeProfileImage",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Profile image removed successfully",
    });
  } catch (error) {
    educademyLogger.error("Profile image removal failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "REMOVE_PROFILE_IMAGE",
        entity: "USER",
        entityId: req.userAuthId,
        status: "ERROR",
      },
      request: {
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "removeProfileImage",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to remove profile image",
      requestId: requestId,
    });
  }
});

export const getUserProfile = asyncHandler(async (req, res) => {
  console.log(req.userAuthId);

  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AuthController",
    methodName: "getUserProfile",
  });

  educademyLogger.logMethodEntry("AuthController", "getUserProfile", {
    userId: req.userAuthId,
    clientIp: req.ip,
    userAgent: req.get("User-Agent"),
  });

  try {
    educademyLogger.info("Retrieving user profile with related data", {
      business: {
        operation: "USER_PROFILE_LOOKUP",
        entity: "USER",
        entityId: req.userAuthId,
        status: "RETRIEVING",
      },
      database: {
        operation: "SELECT",
        table: "users",
        includeRelations: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.userAuthId },
      include: {
        studentProfile: true,
        instructorProfile: true,
        adminProfile: true,
        notificationSettings: true,
      },
    });

    if (!user) {
      educademyLogger.error("User not found for profile retrieval", null, {
        userId: req.userAuthId,
        business: {
          operation: "GET_USER_PROFILE",
          entity: "USER",
          entityId: req.userAuthId,
          status: "USER_NOT_FOUND",
        },
      });

      educademyLogger.logBusinessOperation(
        "GET_USER_PROFILE",
        "USER",
        req.userAuthId,
        "FAILED",
        { reason: "User not found" }
      );

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    educademyLogger.logBusinessOperation(
      "GET_USER_PROFILE",
      "USER",
      user.id,
      "SUCCESS",
      {
        role: user.role,
        hasNotificationSettings: !!user.notificationSettings,
        hasStudentProfile: !!user.studentProfile,
        hasInstructorProfile: !!user.instructorProfile,
        hasAdminProfile: !!user.adminProfile,
      }
    );

    educademyLogger.logAuditTrail(
      "PROFILE_ACCESS",
      "USER",
      user.id,
      null,
      "ACCESSED",
      req.userAuthId
    );

    educademyLogger.performance("GET_USER_PROFILE", startTime, {
      userId: user.id,
      totalQueries: 1,
      profileType: user.role,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "getUserProfile",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
        isVerified: user.isVerified,
        timezone: user.timezone,
        language: user.language,
        country: user.country,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        website: user.website,
        linkedinProfile: user.linkedinProfile,
        twitterProfile: user.twitterProfile,
        githubProfile: user.githubProfile,
        profile:
          user.role === "STUDENT"
            ? user.studentProfile
            : user.role === "INSTRUCTOR"
            ? user.instructorProfile
            : user.adminProfile,
        notificationSettings: user.notificationSettings,
      },
    });
  } catch (error) {
    educademyLogger.error("Get profile failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "GET_USER_PROFILE",
        entity: "USER",
        entityId: req.userAuthId,
        status: "ERROR",
      },
      request: {
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "getUserProfile",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile",
      requestId: requestId,
    });
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  educademyLogger.setContext({
    requestId,
    userId: req.userAuthId,
    className: "AuthController",
    methodName: "logoutUser",
  });

  educademyLogger.logMethodEntry("AuthController", "logoutUser", {
    userId: req.userAuthId,
    clientIp: req.ip,
    userAgent: req.get("User-Agent"),
  });

  try {
    const token = getTokenFromHeader(req);
    let deletedSessionsCount = 0;

    if (token) {
      educademyLogger.info("Deleting user sessions from database", {
        business: {
          operation: "SESSION_DELETION",
          entity: "SESSION",
          entityId: req.userAuthId,
          status: "DELETING",
        },
        database: {
          operation: "DELETE",
          table: "sessions",
        },
      });

      const deletedSessions = await prisma.session.deleteMany({
        where: {
          token,
          userId: req.userAuthId,
        },
      });

      deletedSessionsCount = deletedSessions.count;

      educademyLogger.logBusinessOperation(
        "DELETE_USER_SESSION",
        "SESSION",
        req.userAuthId,
        "SUCCESS",
        {
          deletedCount: deletedSessionsCount,
          token: token.substring(0, 10) + "...",
        }
      );
    }

    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          educademyLogger.warn("Failed to destroy HTTP session", {
            error: err,
            userId: req.userAuthId,
          });
        } else {
          educademyLogger.logBusinessOperation(
            "DESTROY_HTTP_SESSION",
            "SESSION",
            req.userAuthId,
            "SUCCESS"
          );
        }
      });
    }

    educademyLogger.logAuditTrail(
      "USER_LOGOUT",
      "USER",
      req.userAuthId,
      "LOGGED_IN",
      "LOGGED_OUT",
      req.userAuthId
    );

    educademyLogger.logSecurityEvent(
      "USER_LOGOUT_SUCCESS",
      "INFO",
      {
        userId: req.userAuthId,
        sessionsDeleted: deletedSessionsCount,
        ip: req.ip,
      },
      req.userAuthId
    );

    educademyLogger.auth("LOGOUT", true, req.user, {
      sessionsDeleted: deletedSessionsCount,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    educademyLogger.performance("USER_LOGOUT", startTime, {
      userId: req.userAuthId,
      totalQueries: deletedSessionsCount > 0 ? 1 : 0,
      sessionsDeleted: deletedSessionsCount,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "logoutUser",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    educademyLogger.error("Logout failed", error, {
      userId: req.userAuthId,
      business: {
        operation: "USER_LOGOUT",
        entity: "USER",
        entityId: req.userAuthId,
        status: "ERROR",
      },
      request: {
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    educademyLogger.logSecurityEvent(
      "USER_LOGOUT_ERROR",
      "MEDIUM",
      {
        userId: req.userAuthId,
        error: error.message,
        ip: req.ip,
      },
      req.userAuthId
    );

    educademyLogger.logMethodExit(
      "AuthController",
      "logoutUser",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Logout failed",
      requestId: requestId,
    });
  }
});

export const exchangeAuthCode = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { code } = req.body;

  educademyLogger.setContext({
    requestId,
    className: "AuthController",
    methodName: "exchangeAuthCode",
  });

  educademyLogger.logMethodEntry("AuthController", "exchangeAuthCode", {
    hasCode: !!code,
    ip: req.ip,
    codeLength: code?.length,
    userAgent: req.get("User-Agent"),
  });

  if (!code) {
    educademyLogger.logValidationError("code", code, "Auth code is required", {
      operation: "EXCHANGE_AUTH_CODE",
    });
    return res.status(400).json({
      success: false,
      message: "Auth code is required",
    });
  }

  try {
    educademyLogger.info("Looking up auth session by code", {
      business: {
        operation: "SESSION_LOOKUP",
        entity: "SESSION",
        status: "FINDING_AUTH_CODE",
      },
      database: {
        operation: "SELECT",
        table: "sessions",
        includeRelations: true,
      },
    });

    const authSession = await prisma.session.findFirst({
      where: {
        token: code,
        device: "temp_auth_code",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            studentProfile: true,
            instructorProfile: true,
            adminProfile: true,
          },
        },
      },
    });

    if (!authSession) {
      educademyLogger.logBusinessOperation(
        "EXCHANGE_AUTH_CODE",
        "SESSION",
        null,
        "FAILED",
        { reason: "Invalid or expired auth code", codeLength: code.length }
      );

      educademyLogger.logSecurityEvent("INVALID_AUTH_CODE_EXCHANGE", "MEDIUM", {
        codeLength: code.length,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid or expired auth code",
      });
    }

    educademyLogger.setContext({
      requestId,
      userId: authSession.userId,
      className: "AuthController",
      methodName: "exchangeAuthCode",
    });

    educademyLogger.logBusinessOperation(
      "AUTH_SESSION_LOOKUP",
      "SESSION",
      authSession.id,
      "SUCCESS",
      { userId: authSession.userId, isValid: true }
    );

    educademyLogger.info("Deleting temporary auth session", {
      business: {
        operation: "SESSION_DELETION",
        entity: "SESSION",
        entityId: authSession.id,
        status: "DELETING_TEMP",
      },
      database: {
        operation: "DELETE",
        table: "sessions",
      },
    });

    await prisma.session.delete({
      where: { id: authSession.id },
    });

    educademyLogger.logBusinessOperation(
      "DELETE_TEMP_AUTH_SESSION",
      "SESSION",
      authSession.id,
      "SUCCESS",
      { userId: authSession.userId }
    );

    const token = generateToken(authSession.userId);

    educademyLogger.info("Creating permanent user session", {
      business: {
        operation: "SESSION_CREATION",
        entity: "SESSION",
        status: "CREATING_PERMANENT",
      },
      database: {
        operation: "INSERT",
        table: "sessions",
      },
    });

    const newSession = await prisma.session.create({
      data: {
        token,
        userId: authSession.userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        device: req.get("User-Agent")?.substring(0, 255),
        ipAddress: req.ip,
      },
    });

    educademyLogger.logBusinessOperation(
      "CREATE_PERMANENT_SESSION",
      "SESSION",
      newSession.id,
      "SUCCESS",
      {
        userId: authSession.userId,
        expiresAt: newSession.expiresAt,
      }
    );

    educademyLogger.logAuditTrail(
      "AUTH_CODE_EXCHANGE",
      "SESSION",
      newSession.id,
      "TEMP_CODE",
      "PERMANENT_TOKEN",
      authSession.userId
    );

    const user = authSession.user;

    educademyLogger.auth("EXCHANGE_AUTH_CODE", true, user, {
      sessionId: newSession.id,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    educademyLogger.logSecurityEvent(
      "AUTH_CODE_EXCHANGE_SUCCESS",
      "INFO",
      {
        userId: authSession.userId,
        sessionId: newSession.id,
        ip: req.ip,
      },
      authSession.userId
    );

    educademyLogger.performance("EXCHANGE_AUTH_CODE", startTime, {
      userId: authSession.userId,
      totalQueries: 3,
      tokenGenerated: true,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "exchangeAuthCode",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        profile:
          user.role === "STUDENT"
            ? user.studentProfile
            : user.role === "INSTRUCTOR"
            ? user.instructorProfile
            : user.adminProfile,
      },
    });
  } catch (error) {
    educademyLogger.error("Auth code exchange failed", error, {
      business: {
        operation: "EXCHANGE_AUTH_CODE",
        entity: "SESSION",
        status: "ERROR",
      },
      request: {
        body: req.body,
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    educademyLogger.logSecurityEvent("AUTH_CODE_EXCHANGE_ERROR", "HIGH", {
      error: error.message,
      ip: req.ip,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "exchangeAuthCode",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to exchange auth code",
      requestId: requestId,
    });
  }
});

const createTempAuthCode = async (userId) => {
  const startTime = performance.now();

  educademyLogger.logMethodEntry("AuthController", "createTempAuthCode", {
    userId,
  });

  try {
    const authCode = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    educademyLogger.info("Creating temporary auth session", {
      business: {
        operation: "SESSION_CREATION",
        entity: "SESSION",
        status: "CREATING",
      },
      database: {
        operation: "INSERT",
        table: "sessions",
      },
    });

    const session = await prisma.session.create({
      data: {
        token: authCode,
        userId,
        expiresAt,
        device: "temp_auth_code",
        ipAddress: "oauth_callback",
      },
    });

    educademyLogger.logBusinessOperation(
      "CREATE_TEMP_AUTH_CODE",
      "SESSION",
      session.id,
      "SUCCESS",
      { userId, expiresAt }
    );

    educademyLogger.logMethodExit(
      "AuthController",
      "createTempAuthCode",
      true,
      performance.now() - startTime
    );

    return authCode;
  } catch (error) {
    educademyLogger.error("Failed to create temp auth code", error, {
      userId,
      business: {
        operation: "CREATE_TEMP_AUTH_CODE",
        entity: "SESSION",
        entityId: userId,
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "createTempAuthCode",
      false,
      performance.now() - startTime
    );
    throw error;
  }
};

const handleOAuthProfileImage = async (imageUrl, userId) => {
  const startTime = performance.now();

  educademyLogger.logMethodEntry("AuthController", "handleOAuthProfileImage", {
    imageUrl: !!imageUrl,
    userId,
  });

  try {
    if (!imageUrl) {
      educademyLogger.logMethodExit(
        "AuthController",
        "handleOAuthProfileImage",
        true,
        performance.now() - startTime
      );
      return null;
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      educademyLogger.warn(
        "OAuth profile image fetch failed, using original URL",
        {
          imageUrl,
          userId,
          responseStatus: response.status,
        }
      );
      return imageUrl;
    }

    const buffer = await response.buffer();

    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${buffer.toString("base64")}`,
      {
        folder: "educademy/profiles",
        public_id: `profile_${userId}_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto:good" },
        ],
      }
    );

    educademyLogger.logBusinessOperation(
      "PROCESS_OAUTH_IMAGE",
      "PROFILE_IMAGE",
      userId,
      "SUCCESS",
      { originalUrl: imageUrl, cloudinaryUrl: result.secure_url }
    );

    educademyLogger.logMethodExit(
      "AuthController",
      "handleOAuthProfileImage",
      true,
      performance.now() - startTime
    );

    return result.secure_url;
  } catch (error) {
    educademyLogger.error("Failed to process OAuth profile image", error, {
      imageUrl,
      userId,
      business: {
        operation: "PROCESS_OAUTH_IMAGE",
        entity: "PROFILE_IMAGE",
        entityId: userId,
        status: "ERROR",
      },
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "handleOAuthProfileImage",
      false,
      performance.now() - startTime
    );
    return imageUrl;
  }
};

export const googleAuth = asyncHandler(async (req, res, next) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { role = "STUDENT" } = req.query;

  // Validate role
  const validRoles = ["STUDENT", "INSTRUCTOR"];
  const userRole = validRoles.includes(role) ? role : "STUDENT";

  // Store role in session for callback
  req.session.pendingRole = userRole;

  educademyLogger.setContext({
    requestId,
    className: "AuthController",
    methodName: "googleAuth",
  });

  educademyLogger.logMethodEntry("AuthController", "googleAuth", {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    role: userRole,
  });

  educademyLogger.logBusinessOperation(
    "INITIATE_GOOGLE_AUTH",
    "OAUTH",
    null,
    "REDIRECTING",
    {
      provider: "google",
      role: userRole,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    }
  );

  educademyLogger.logSecurityEvent("OAUTH_INITIATION", "INFO", {
    provider: "google",
    role: userRole,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  educademyLogger.logMethodExit("AuthController", "googleAuth", true, 0);

  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
});

export const googleAuthCallback = asyncHandler(async (req, res, next) => {
  passport.authenticate("google", async (err, profile) => {
    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    // Get role from session, default to STUDENT
    const userRole = req.session.pendingRole || "STUDENT";

    // Clear the pending role from session
    delete req.session.pendingRole;

    educademyLogger.setContext({
      requestId,
      className: "AuthController",
      methodName: "googleAuthCallback",
    });

    educademyLogger.logMethodEntry("AuthController", "googleAuthCallback", {
      hasError: !!err,
      hasProfile: !!profile,
      role: userRole,
      ip: req.ip,
    });

    try {
      if (err) {
        educademyLogger.error("Google auth error", err, {
          business: {
            operation: "GOOGLE_AUTH_CALLBACK",
            entity: "OAUTH",
            status: "ERROR",
          },
        });

        educademyLogger.logSecurityEvent("OAUTH_ERROR", "HIGH", {
          provider: "google",
          error: err.message,
          ip: req.ip,
        });

        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=auth_failed`
        );
      }

      if (!profile) {
        educademyLogger.logBusinessOperation(
          "GOOGLE_AUTH_CALLBACK",
          "OAUTH",
          null,
          "CANCELLED",
          { reason: "No profile returned" }
        );

        educademyLogger.logSecurityEvent("OAUTH_CANCELLED", "MEDIUM", {
          provider: "google",
          ip: req.ip,
        });

        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=auth_cancelled`
        );
      }

      const normalizedEmail = profile.emails[0].value.toLowerCase();

      educademyLogger.info("Looking up user for Google OAuth", {
        business: {
          operation: "USER_LOOKUP",
          entity: "USER",
          status: "OAUTH_LOOKUP",
        },
        database: {
          operation: "SELECT",
          table: "users",
          includeRelations: true,
        },
      });

      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          socialLogins: true,
          studentProfile: true,
          instructorProfile: true,
          adminProfile: true,
        },
      });

      if (user) {
        educademyLogger.setContext({
          requestId,
          userId: user.id,
          className: "AuthController",
          methodName: "googleAuthCallback",
        });

        educademyLogger.logBusinessOperation(
          "OAUTH_USER_LOOKUP",
          "USER",
          user.id,
          "EXISTING_USER_FOUND",
          { email: normalizedEmail, provider: "google" }
        );

        const existingGoogleLogin = user.socialLogins.find(
          (login) =>
            login.provider === "google" && login.providerId === profile.id
        );

        if (!existingGoogleLogin) {
          educademyLogger.info("Creating new social login record", {
            business: {
              operation: "SOCIAL_LOGIN_CREATION",
              entity: "SOCIAL_LOGIN",
              status: "CREATING",
            },
            database: {
              operation: "INSERT",
              table: "socialLogins",
            },
          });

          await prisma.socialLogin.create({
            data: {
              provider: "google",
              providerId: profile.id,
              userId: user.id,
            },
          });

          educademyLogger.logBusinessOperation(
            "LINK_GOOGLE_ACCOUNT",
            "SOCIAL_LOGIN",
            user.id,
            "SUCCESS",
            { provider: "google", providerId: profile.id }
          );

          educademyLogger.logAuditTrail(
            "LINK_SOCIAL_ACCOUNT",
            "USER",
            user.id,
            null,
            "google",
            user.id
          );
        }

        let profileImageUrl = user.profileImage;
        if (!profileImageUrl && profile.photos?.[0]?.value) {
          profileImageUrl = await handleOAuthProfileImage(
            profile.photos[0].value,
            user.id
          );

          if (profileImageUrl !== profile.photos[0].value) {
            educademyLogger.info("Updating user profile image from OAuth", {
              business: {
                operation: "USER_UPDATE",
                entity: "USER",
                entityId: user.id,
                status: "UPDATING_IMAGE",
              },
              database: {
                operation: "UPDATE",
                table: "users",
              },
            });

            user = await prisma.user.update({
              where: { id: user.id },
              data: { profileImage: profileImageUrl },
            });

            educademyLogger.logAuditTrail(
              "UPDATE_PROFILE_IMAGE_OAUTH",
              "USER",
              user.id,
              user.profileImage,
              profileImageUrl,
              user.id
            );
          }
        }

        if (!user.isVerified) {
          educademyLogger.info("Auto-verifying user from OAuth", {
            business: {
              operation: "USER_UPDATE",
              entity: "USER",
              entityId: user.id,
              status: "AUTO_VERIFYING",
            },
            database: {
              operation: "UPDATE",
              table: "users",
            },
          });

          user = await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
          });

          educademyLogger.logAuditTrail(
            "AUTO_VERIFY_OAUTH",
            "USER",
            user.id,
            false,
            true,
            user.id
          );

          educademyLogger.logSecurityEvent(
            "AUTO_VERIFICATION_OAUTH",
            "INFO",
            {
              userId: user.id,
              provider: "google",
              email: normalizedEmail,
            },
            user.id
          );

          const welcomeEmailResult = await emailService.sendWelcomeEmail({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          });

          educademyLogger.logBusinessOperation(
            "SEND_WELCOME_EMAIL_OAUTH",
            "EMAIL",
            user.id,
            welcomeEmailResult.success ? "SUCCESS" : "FAILED",
            { provider: "google" }
          );
        }

        educademyLogger.info("Updating user last login for OAuth", {
          business: {
            operation: "USER_UPDATE",
            entity: "USER",
            entityId: user.id,
            status: "UPDATING_LOGIN",
          },
          database: {
            operation: "UPDATE",
            table: "users",
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        educademyLogger.logAuditTrail(
          "OAUTH_LOGIN",
          "USER",
          user.id,
          user.lastLogin,
          new Date(),
          user.id
        );

        educademyLogger.auth("GOOGLE_LOGIN", true, user, {
          isExistingUser: true,
          autoVerified: !user.isVerified,
          profileImageUpdated: profileImageUrl !== user.profileImage,
          clientIp: req.ip,
          userAgent: req.get("User-Agent"),
        });

        educademyLogger.logSecurityEvent(
          "OAUTH_LOGIN_SUCCESS",
          "INFO",
          {
            userId: user.id,
            provider: "google",
            email: normalizedEmail,
            ip: req.ip,
          },
          user.id
        );
      } else {
        const profileImageUrl = profile.photos?.[0]?.value
          ? await handleOAuthProfileImage(
              profile.photos[0].value,
              `temp_${Date.now()}`
            )
          : null;

        educademyLogger.info("Creating new user from Google OAuth", {
          business: {
            operation: "USER_CREATION",
            entity: "USER",
            status: "CREATING_FROM_OAUTH",
          },
          database: {
            operation: "INSERT",
            table: "users",
          },
        });

        user = await prisma.user.create({
          data: {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: normalizedEmail,
            profileImage: profileImageUrl,
            role: userRole, // Use dynamic role from session
            isVerified: true,
            isActive: true,
            lastLogin: new Date(),
          },
        });

        educademyLogger.setContext({
          requestId,
          userId: user.id,
          className: "AuthController",
          methodName: "googleAuthCallback",
        });

        educademyLogger.logBusinessOperation(
          "CREATE_USER_GOOGLE_OAUTH",
          "USER",
          user.id,
          "SUCCESS",
          {
            email: normalizedEmail,
            role: userRole,
            hasProfileImage: !!profileImageUrl,
          }
        );

        educademyLogger.logAuditTrail(
          "USER_CREATION_OAUTH",
          "USER",
          user.id,
          null,
          "CREATED",
          user.id
        );

        educademyLogger.info("Creating social login record for new user", {
          business: {
            operation: "SOCIAL_LOGIN_CREATION",
            entity: "SOCIAL_LOGIN",
            status: "CREATING",
          },
          database: {
            operation: "INSERT",
            table: "socialLogins",
          },
        });

        await prisma.socialLogin.create({
          data: {
            provider: "google",
            providerId: profile.id,
            userId: user.id,
          },
        });

        educademyLogger.logBusinessOperation(
          "CREATE_SOCIAL_LOGIN",
          "SOCIAL_LOGIN",
          user.id,
          "SUCCESS",
          { provider: "google", providerId: profile.id }
        );

        await createUserProfile(user.id, userRole);

        const welcomeEmailResult = await emailService.sendWelcomeEmail({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });

        educademyLogger.logBusinessOperation(
          "SEND_WELCOME_EMAIL_NEW_USER",
          "EMAIL",
          user.id,
          welcomeEmailResult.success ? "SUCCESS" : "FAILED",
          { provider: "google" }
        );

        educademyLogger.auth("GOOGLE_REGISTER", true, user, {
          isNewUser: true,
          autoVerified: true,
          role: userRole,
          profileImageFromGoogle: !!profileImageUrl,
          clientIp: req.ip,
          userAgent: req.get("User-Agent"),
        });

        educademyLogger.logSecurityEvent(
          "OAUTH_REGISTRATION_SUCCESS",
          "INFO",
          {
            userId: user.id,
            provider: "google",
            email: normalizedEmail,
            role: userRole,
            ip: req.ip,
          },
          user.id
        );
      }

      const authCode = await createTempAuthCode(user.id);

      educademyLogger.logBusinessOperation(
        "OAUTH_REDIRECT_SUCCESS",
        "OAUTH",
        user.id,
        "SUCCESS",
        {
          provider: "google",
          authCodeCreated: true,
        }
      );

      educademyLogger.performance("GOOGLE_AUTH_CALLBACK", startTime, {
        userId: user.id,
        totalQueries: user ? 4 : 6,
        isNewUser: !user,
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "googleAuthCallback",
        true,
        performance.now() - startTime
      );

      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?code=${authCode}&success=true`
      );
    } catch (error) {
      educademyLogger.error("Google auth callback failed", error, {
        business: {
          operation: "GOOGLE_AUTH_CALLBACK",
          entity: "OAUTH",
          status: "ERROR",
        },
        request: {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        },
      });

      educademyLogger.logSecurityEvent("OAUTH_CALLBACK_ERROR", "HIGH", {
        provider: "google",
        error: error.message,
        ip: req.ip,
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "googleAuthCallback",
        false,
        performance.now() - startTime
      );

      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  })(req, res, next);
});

export const gitHubAuth = asyncHandler(async (req, res, next) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  const { role = "STUDENT" } = req.query;

  // Validate role
  const validRoles = ["STUDENT", "INSTRUCTOR"];
  const userRole = validRoles.includes(role) ? role : "STUDENT";

  // Store role in session for callback
  req.session.pendingRole = userRole;

  educademyLogger.setContext({
    requestId,
    className: "AuthController",
    methodName: "gitHubAuth",
  });

  educademyLogger.logMethodEntry("AuthController", "gitHubAuth", {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    role: userRole,
  });

  educademyLogger.logBusinessOperation(
    "INITIATE_GITHUB_AUTH",
    "OAUTH",
    null,
    "REDIRECTING",
    {
      provider: "github",
      role: userRole,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    }
  );

  educademyLogger.logSecurityEvent("OAUTH_INITIATION", "INFO", {
    provider: "github",
    role: userRole,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  educademyLogger.logMethodExit("AuthController", "gitHubAuth", true, 0);

  passport.authenticate("github", {
    scope: ["user:email"],
  })(req, res, next);
});

export const gitHubAuthCallback = asyncHandler(async (req, res, next) => {
  passport.authenticate("github", async (err, profile) => {
    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    // Get role from session, default to STUDENT
    const userRole = req.session.pendingRole || "STUDENT";

    // Clear the pending role from session
    delete req.session.pendingRole;

    educademyLogger.setContext({
      requestId,
      className: "AuthController",
      methodName: "gitHubAuthCallback",
    });

    educademyLogger.logMethodEntry("AuthController", "gitHubAuthCallback", {
      hasError: !!err,
      hasProfile: !!profile,
      role: userRole,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    try {
      if (err) {
        educademyLogger.error("GitHub auth error", err, {
          business: {
            operation: "GITHUB_AUTH_CALLBACK",
            entity: "OAUTH",
            status: "ERROR",
          },
        });

        educademyLogger.logSecurityEvent("OAUTH_ERROR", "HIGH", {
          provider: "github",
          error: err.message,
          ip: req.ip,
        });

        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=auth_failed`
        );
      }

      if (!profile) {
        educademyLogger.logBusinessOperation(
          "GITHUB_AUTH_CALLBACK",
          "OAUTH",
          null,
          "CANCELLED",
          { reason: "No profile returned" }
        );

        educademyLogger.logSecurityEvent("OAUTH_CANCELLED", "MEDIUM", {
          provider: "github",
          ip: req.ip,
        });

        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=auth_cancelled`
        );
      }

      const normalizedEmail = profile.emails[0].value.toLowerCase();

      educademyLogger.info("Looking up user for GitHub OAuth", {
        business: {
          operation: "USER_LOOKUP",
          entity: "USER",
          status: "OAUTH_LOOKUP",
        },
        database: {
          operation: "SELECT",
          table: "users",
          includeRelations: true,
        },
      });

      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          socialLogins: true,
          studentProfile: true,
          instructorProfile: true,
          adminProfile: true,
        },
      });

      if (user) {
        educademyLogger.setContext({
          requestId,
          userId: user.id,
          className: "AuthController",
          methodName: "gitHubAuthCallback",
        });

        educademyLogger.logBusinessOperation(
          "OAUTH_USER_LOOKUP",
          "USER",
          user.id,
          "EXISTING_USER_FOUND",
          { email: normalizedEmail, provider: "github" }
        );

        const existingGitHubLogin = user.socialLogins.find(
          (login) =>
            login.provider === "github" && login.providerId === profile.id
        );

        if (!existingGitHubLogin) {
          educademyLogger.info("Creating new GitHub social login record", {
            business: {
              operation: "SOCIAL_LOGIN_CREATION",
              entity: "SOCIAL_LOGIN",
              status: "CREATING",
            },
            database: {
              operation: "INSERT",
              table: "socialLogins",
            },
          });

          await prisma.socialLogin.create({
            data: {
              provider: "github",
              providerId: profile.id,
              userId: user.id,
            },
          });

          educademyLogger.logBusinessOperation(
            "LINK_GITHUB_ACCOUNT",
            "SOCIAL_LOGIN",
            user.id,
            "SUCCESS",
            { provider: "github", providerId: profile.id }
          );

          educademyLogger.logAuditTrail(
            "LINK_SOCIAL_ACCOUNT",
            "USER",
            user.id,
            null,
            "github",
            user.id
          );
        }

        let profileImageUrl = user.profileImage;
        if (!profileImageUrl && profile.photos?.[0]?.value) {
          profileImageUrl = await handleOAuthProfileImage(
            profile.photos[0].value,
            user.id
          );

          if (profileImageUrl !== profile.photos[0].value) {
            educademyLogger.info(
              "Updating user profile image from GitHub OAuth",
              {
                business: {
                  operation: "USER_UPDATE",
                  entity: "USER",
                  entityId: user.id,
                  status: "UPDATING_IMAGE",
                },
                database: {
                  operation: "UPDATE",
                  table: "users",
                },
              }
            );

            user = await prisma.user.update({
              where: { id: user.id },
              data: { profileImage: profileImageUrl },
            });

            educademyLogger.logAuditTrail(
              "UPDATE_PROFILE_IMAGE_OAUTH",
              "USER",
              user.id,
              user.profileImage,
              profileImageUrl,
              user.id
            );
          }
        }

        if (!user.isVerified) {
          educademyLogger.info("Auto-verifying user from GitHub OAuth", {
            business: {
              operation: "USER_UPDATE",
              entity: "USER",
              entityId: user.id,
              status: "AUTO_VERIFYING",
            },
            database: {
              operation: "UPDATE",
              table: "users",
            },
          });

          user = await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
          });

          educademyLogger.logAuditTrail(
            "AUTO_VERIFY_OAUTH",
            "USER",
            user.id,
            false,
            true,
            user.id
          );

          const welcomeEmailResult = await emailService.sendWelcomeEmail({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          });

          educademyLogger.logBusinessOperation(
            "SEND_WELCOME_EMAIL_OAUTH",
            "EMAIL",
            user.id,
            welcomeEmailResult.success ? "SUCCESS" : "FAILED",
            { provider: "github" }
          );
        }

        educademyLogger.info("Updating user last login for GitHub OAuth", {
          business: {
            operation: "USER_UPDATE",
            entity: "USER",
            entityId: user.id,
            status: "UPDATING_LOGIN",
          },
          database: {
            operation: "UPDATE",
            table: "users",
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        educademyLogger.auth("GITHUB_LOGIN", true, user, {
          isExistingUser: true,
          autoVerified: !user.isVerified,
          profileImageUpdated: profileImageUrl !== user.profileImage,
          clientIp: req.ip,
          userAgent: req.get("User-Agent"),
        });

        educademyLogger.logSecurityEvent(
          "OAUTH_LOGIN_SUCCESS",
          "INFO",
          {
            userId: user.id,
            provider: "github",
            email: normalizedEmail,
            ip: req.ip,
          },
          user.id
        );
      } else {
        const profileImageUrl = profile.photos?.[0]?.value
          ? await handleOAuthProfileImage(
              profile.photos[0].value,
              `temp_${Date.now()}`
            )
          : null;

        const nameParts = profile.displayName
          ? profile.displayName.split(" ")
          : ["GitHub", "User"];
        const firstName = nameParts[0] || "GitHub";
        const lastName = nameParts.slice(1).join(" ") || "User";

        educademyLogger.info("Creating new user from GitHub OAuth", {
          business: {
            operation: "USER_CREATION",
            entity: "USER",
            status: "CREATING_FROM_OAUTH",
          },
          database: {
            operation: "INSERT",
            table: "users",
          },
        });

        user = await prisma.user.create({
          data: {
            firstName,
            lastName,
            email: normalizedEmail,
            profileImage: profileImageUrl,
            githubProfile: profile.profileUrl,
            role: userRole, // Use dynamic role from session
            isVerified: true,
            isActive: true,
            lastLogin: new Date(),
          },
        });

        educademyLogger.setContext({
          requestId,
          userId: user.id,
          className: "AuthController",
          methodName: "gitHubAuthCallback",
        });

        educademyLogger.logBusinessOperation(
          "CREATE_USER_GITHUB_OAUTH",
          "USER",
          user.id,
          "SUCCESS",
          {
            email: normalizedEmail,
            role: userRole,
            hasProfileImage: !!profileImageUrl,
            githubProfile: profile.profileUrl,
          }
        );

        educademyLogger.info(
          "Creating GitHub social login record for new user",
          {
            business: {
              operation: "SOCIAL_LOGIN_CREATION",
              entity: "SOCIAL_LOGIN",
              status: "CREATING",
            },
            database: {
              operation: "INSERT",
              table: "socialLogins",
            },
          }
        );

        await prisma.socialLogin.create({
          data: {
            provider: "github",
            providerId: profile.id,
            userId: user.id,
          },
        });

        await createUserProfile(user.id, userRole);

        const welcomeEmailResult = await emailService.sendWelcomeEmail({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });

        educademyLogger.logBusinessOperation(
          "SEND_WELCOME_EMAIL_NEW_USER",
          "EMAIL",
          user.id,
          welcomeEmailResult.success ? "SUCCESS" : "FAILED",
          { provider: "github" }
        );

        educademyLogger.auth("GITHUB_REGISTER", true, user, {
          isNewUser: true,
          autoVerified: true,
          role: userRole,
          profileImageFromGitHub: !!profileImageUrl,
          clientIp: req.ip,
          userAgent: req.get("User-Agent"),
        });

        educademyLogger.logSecurityEvent(
          "OAUTH_REGISTRATION_SUCCESS",
          "INFO",
          {
            userId: user.id,
            provider: "github",
            email: normalizedEmail,
            role: userRole,
            ip: req.ip,
          },
          user.id
        );
      }

      const authCode = await createTempAuthCode(user.id);

      educademyLogger.logBusinessOperation(
        "OAUTH_REDIRECT_SUCCESS",
        "OAUTH",
        user.id,
        "SUCCESS",
        {
          provider: "github",
          authCodeCreated: true,
        }
      );

      educademyLogger.performance("GITHUB_AUTH_CALLBACK", startTime, {
        userId: user.id,
        totalQueries: user ? 4 : 6,
        isNewUser: !user,
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "gitHubAuthCallback",
        true,
        performance.now() - startTime
      );

      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?code=${authCode}&success=true`
      );
    } catch (error) {
      educademyLogger.error("GitHub auth callback failed", error, {
        business: {
          operation: "GITHUB_AUTH_CALLBACK",
          entity: "OAUTH",
          status: "ERROR",
        },
        request: {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        },
      });

      educademyLogger.logSecurityEvent("OAUTH_CALLBACK_ERROR", "HIGH", {
        provider: "github",
        error: error.message,
        ip: req.ip,
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "gitHubAuthCallback",
        false,
        performance.now() - startTime
      );

      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  })(req, res, next);
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { email } = req.body;

  educademyLogger.setContext({
    requestId,
    className: "AuthController",
    methodName: "requestPasswordReset",
  });

  educademyLogger.logMethodEntry("AuthController", "requestPasswordReset", {
    email,
    hasEmail: !!email,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  if (!email) {
    educademyLogger.logValidationError("email", email, "Email is required", {
      operation: "REQUEST_PASSWORD_RESET",
    });
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    educademyLogger.info("Looking up user for password reset", {
      business: {
        operation: "USER_LOOKUP",
        entity: "USER",
        status: "FINDING_FOR_PASSWORD_RESET",
      },
      database: {
        operation: "SELECT",
        table: "users",
        lookupField: "email",
      },
    });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      educademyLogger.logBusinessOperation(
        "PASSWORD_RESET_REQUEST",
        "USER",
        null,
        "USER_NOT_FOUND",
        { email: normalizedEmail }
      );

      educademyLogger.logSecurityEvent("PASSWORD_RESET_UNKNOWN_EMAIL", "LOW", {
        email: normalizedEmail,
        ip: req.ip,
      });

      return res.status(200).json({
        success: true,
        message:
          "If an account with this email exists, you will receive a password reset email.",
      });
    }

    educademyLogger.setContext({
      requestId,
      userId: user.id,
      className: "AuthController",
      methodName: "requestPasswordReset",
    });

    educademyLogger.logBusinessOperation(
      "USER_LOOKUP",
      "USER",
      user.id,
      "SUCCESS",
      { email: normalizedEmail, forPasswordReset: true }
    );

    const otp = otpService.generateOTP();
    await otpService.storeOTP(normalizedEmail, otp, 15);

    const emailResult = await emailService.sendPasswordResetOTP({
      email: normalizedEmail,
      firstName: user.firstName,
      otp,
      expiresIn: 15,
    });

    educademyLogger.logBusinessOperation(
      "SEND_PASSWORD_RESET_OTP",
      "EMAIL",
      user.id,
      emailResult.success ? "SUCCESS" : "FAILED",
      { email: normalizedEmail, expiresIn: 15 }
    );

    educademyLogger.logAuditTrail(
      "PASSWORD_RESET_REQUEST",
      "USER",
      user.id,
      null,
      "REQUESTED",
      user.id
    );

    educademyLogger.logSecurityEvent(
      "PASSWORD_RESET_REQUESTED",
      "INFO",
      {
        userId: user.id,
        email: normalizedEmail,
        otpSent: emailResult.success,
        ip: req.ip,
      },
      user.id
    );

    educademyLogger.auth("PASSWORD_RESET_REQUEST", true, user, {
      emailSent: emailResult.success,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    educademyLogger.performance("REQUEST_PASSWORD_RESET", startTime, {
      userId: user.id,
      totalQueries: 1,
      otpGenerated: true,
      emailSent: emailResult.success,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "requestPasswordReset",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message: "Password reset OTP has been sent to your email.",
    });
  } catch (error) {
    educademyLogger.error("Password reset request failed", error, {
      email: normalizedEmail,
      business: {
        operation: "REQUEST_PASSWORD_RESET",
        entity: "USER",
        status: "ERROR",
      },
      request: {
        body: req.body,
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    educademyLogger.logSecurityEvent("PASSWORD_RESET_REQUEST_ERROR", "MEDIUM", {
      email: normalizedEmail,
      error: error.message,
      ip: req.ip,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "requestPasswordReset",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to process password reset request.",
      requestId: requestId,
    });
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  const { email, otp, newPassword } = req.body;

  educademyLogger.setContext({
    requestId,
    className: "AuthController",
    methodName: "resetPassword",
  });

  educademyLogger.logMethodEntry("AuthController", "resetPassword", {
    email,
    hasOtp: !!otp,
    hasNewPassword: !!newPassword,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  if (!email || !otp || !newPassword) {
    const missingFields = {
      email: !email,
      otp: !otp,
      newPassword: !newPassword,
    };

    Object.entries(missingFields).forEach(([field, isMissing]) => {
      if (isMissing) {
        educademyLogger.logValidationError(field, null, "Field is required", {
          operation: "RESET_PASSWORD",
        });
      }
    });

    educademyLogger.logBusinessOperation(
      "RESET_PASSWORD",
      "USER",
      null,
      "VALIDATION_FAILED",
      { missingFields }
    );

    return res.status(400).json({
      success: false,
      message: "Email, OTP, and new password are required",
    });
  }

  if (newPassword.length < 8) {
    educademyLogger.logValidationError(
      "newPassword",
      newPassword,
      "Password too short",
      {
        passwordLength: newPassword.length,
        operation: "RESET_PASSWORD",
      }
    );

    educademyLogger.logSecurityEvent("WEAK_PASSWORD_RESET_ATTEMPT", "MEDIUM", {
      email,
      passwordLength: newPassword.length,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long",
    });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    educademyLogger.info("Verifying OTP for password reset", {
      business: {
        operation: "OTP_VERIFICATION",
        entity: "OTP",
        status: "VERIFYING_FOR_PASSWORD_RESET",
      },
    });

    const otpResult = await otpService.verifyOTP(normalizedEmail, otp);

    if (!otpResult.success) {
      educademyLogger.logBusinessOperation(
        "VERIFY_PASSWORD_RESET_OTP",
        "OTP",
        null,
        "FAILED",
        {
          email: normalizedEmail,
          reason: otpResult.message,
        }
      );

      educademyLogger.logSecurityEvent("PASSWORD_RESET_INVALID_OTP", "HIGH", {
        email: normalizedEmail,
        reason: otpResult.message,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: otpResult.message,
      });
    }

    educademyLogger.info("Finding user for password reset", {
      business: {
        operation: "USER_LOOKUP",
        entity: "USER",
        status: "FINDING_FOR_PASSWORD_RESET",
      },
      database: {
        operation: "SELECT",
        table: "users",
        lookupField: "email",
      },
    });

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      educademyLogger.logBusinessOperation(
        "RESET_PASSWORD",
        "USER",
        null,
        "USER_NOT_FOUND",
        { email: normalizedEmail }
      );

      educademyLogger.logSecurityEvent(
        "PASSWORD_RESET_USER_NOT_FOUND",
        "HIGH",
        {
          email: normalizedEmail,
          ip: req.ip,
        }
      );

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    educademyLogger.setContext({
      requestId,
      userId: user.id,
      className: "AuthController",
      methodName: "resetPassword",
    });

    educademyLogger.logBusinessOperation(
      "USER_LOOKUP",
      "USER",
      user.id,
      "SUCCESS",
      { email: normalizedEmail, forPasswordReset: true }
    );

    educademyLogger.info("Hashing new password", {
      business: {
        operation: "PASSWORD_HASHING",
        entity: "USER",
        entityId: user.id,
        status: "HASHING",
      },
    });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    educademyLogger.info("Updating user password in database", {
      business: {
        operation: "USER_UPDATE",
        entity: "USER",
        entityId: user.id,
        status: "UPDATING_PASSWORD",
      },
      database: {
        operation: "UPDATE",
        table: "users",
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        salt,
      },
    });

    educademyLogger.logBusinessOperation(
      "RESET_PASSWORD",
      "USER",
      user.id,
      "SUCCESS",
      { email: normalizedEmail }
    );

    educademyLogger.logAuditTrail(
      "PASSWORD_RESET",
      "USER",
      user.id,
      "[REDACTED]",
      "[REDACTED]",
      user.id
    );

    educademyLogger.logSecurityEvent(
      "PASSWORD_RESET_COMPLETED",
      "INFO",
      {
        userId: user.id,
        email: normalizedEmail,
        ip: req.ip,
      },
      user.id
    );

    educademyLogger.info("Invalidating all user sessions for security", {
      business: {
        operation: "SESSION_DELETION",
        entity: "SESSION",
        entityId: user.id,
        status: "INVALIDATING_ALL",
      },
      database: {
        operation: "DELETE",
        table: "sessions",
      },
    });

    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    educademyLogger.logBusinessOperation(
      "INVALIDATE_USER_SESSIONS",
      "SESSION",
      user.id,
      "SUCCESS",
      { deletedCount: deletedSessions.count }
    );

    educademyLogger.logSecurityEvent(
      "SESSIONS_INVALIDATED_PASSWORD_RESET",
      "INFO",
      {
        userId: user.id,
        sessionsDeleted: deletedSessions.count,
        ip: req.ip,
      },
      user.id
    );

    const confirmationEmailResult = await emailService.sendPasswordResetOTP({
      email: normalizedEmail,
      firstName: user.firstName,
      resetTime: new Date().toISOString(),
      ipAddress: req.ip,
    });

    educademyLogger.logBusinessOperation(
      "SEND_PASSWORD_RESET_CONFIRMATION",
      "EMAIL",
      user.id,
      confirmationEmailResult ? "SUCCESS" : "FAILED",
      { email: normalizedEmail }
    );

    educademyLogger.auth("PASSWORD_RESET", true, user, {
      sessionsInvalidated: deletedSessions.count,
      confirmationEmailSent: !!confirmationEmailResult,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    educademyLogger.performance("RESET_PASSWORD", startTime, {
      userId: user.id,
      totalQueries: 3,
      sessionsInvalidated: deletedSessions.count,
      passwordUpdated: true,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "resetPassword",
      true,
      performance.now() - startTime
    );

    res.status(200).json({
      success: true,
      message:
        "Password has been reset successfully. You can now login with your new password. All existing sessions have been invalidated for security.",
    });
  } catch (error) {
    educademyLogger.error("Password reset failed", error, {
      email: normalizedEmail,
      business: {
        operation: "RESET_PASSWORD",
        entity: "USER",
        status: "ERROR",
      },
      request: {
        body: req.body,
        clientIp: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    educademyLogger.logSecurityEvent("PASSWORD_RESET_ERROR", "HIGH", {
      email: normalizedEmail,
      error: error.message,
      ip: req.ip,
    });

    educademyLogger.logMethodExit(
      "AuthController",
      "resetPassword",
      false,
      performance.now() - startTime
    );

    res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
      requestId: requestId,
    });
  }
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  uploadImage.single("profileImage")(req, res, async (err) => {
    if (err) {
      educademyLogger.logValidationError(
        "profileImage",
        req.file,
        err.message,
        {
          userId: req.userAuthId,
          operation: "UPDATE_USER_PROFILE",
        }
      );
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const startTime = performance.now();
    const requestId = Math.random().toString(36).substr(2, 9);

    educademyLogger.setContext({
      requestId,
      userId: req.userAuthId,
      className: "AuthController",
      methodName: "updateUserProfile",
    });

    educademyLogger.logMethodEntry("AuthController", "updateUserProfile", {
      userId: req.userAuthId,
      fieldsToUpdate: Object.keys(req.body),
      hasProfileImage: !!req.file,
      clientIp: req.ip,
      userAgent: req.get("User-Agent"),
    });

    try {
      const {
        firstName,
        lastName,
        bio,
        timezone,
        language,
        country,
        phoneNumber,
        dateOfBirth,
        website,
        linkedinProfile,
        twitterProfile,
        githubProfile,
        // Special flags for profile image operations
        removeProfileImage, // If true, remove existing profile image
        // Role-specific profile updates
        profileData,
      } = req.body;

      // Handle profile image logic
      const hasNewProfileImage = !!req.file;
      const shouldRemoveImage =
        removeProfileImage === "true" || removeProfileImage === true;

      // Validate required fields if provided
      const validationErrors = [];

      if (
        firstName !== undefined &&
        (!firstName || firstName.trim().length < 2)
      ) {
        validationErrors.push({
          field: "firstName",
          message: "First name must be at least 2 characters long",
        });
      }

      if (lastName !== undefined && (!lastName || lastName.trim().length < 2)) {
        validationErrors.push({
          field: "lastName",
          message: "Last name must be at least 2 characters long",
        });
      }

      if (
        phoneNumber !== undefined &&
        phoneNumber &&
        !/^\+?[\d\s\-\(\)]{10,}$/.test(phoneNumber)
      ) {
        validationErrors.push({
          field: "phoneNumber",
          message: "Invalid phone number format",
        });
      }

      if (website !== undefined && website && !/^https?:\/\/.+/.test(website)) {
        validationErrors.push({
          field: "website",
          message:
            "Website must be a valid URL starting with http:// or https://",
        });
      }

      if (
        linkedinProfile !== undefined &&
        linkedinProfile &&
        !/^https?:\/\/(www\.)?linkedin\.com\/.+/.test(linkedinProfile)
      ) {
        validationErrors.push({
          field: "linkedinProfile",
          message: "LinkedIn profile must be a valid LinkedIn URL",
        });
      }

      if (
        twitterProfile !== undefined &&
        twitterProfile &&
        !/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/.test(twitterProfile)
      ) {
        validationErrors.push({
          field: "twitterProfile",
          message: "Twitter profile must be a valid Twitter/X URL",
        });
      }

      if (
        githubProfile !== undefined &&
        githubProfile &&
        !/^https?:\/\/(www\.)?github\.com\/.+/.test(githubProfile)
      ) {
        validationErrors.push({
          field: "githubProfile",
          message: "GitHub profile must be a valid GitHub URL",
        });
      }

      if (dateOfBirth !== undefined && dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (isNaN(birthDate.getTime()) || age < 13 || age > 120) {
          validationErrors.push({
            field: "dateOfBirth",
            message:
              "Invalid date of birth. User must be between 13 and 120 years old",
          });
        }
      }

      if (validationErrors.length > 0) {
        // Clean up uploaded file if validation fails
        if (req.file?.filename) {
          try {
            await deleteFromCloudinary(req.file.filename);
          } catch (deleteError) {
            educademyLogger.warn(
              "Failed to cleanup uploaded file after validation error",
              {
                error: deleteError,
                filename: req.file.filename,
              }
            );
          }
        }

        validationErrors.forEach((error) => {
          educademyLogger.logValidationError(
            error.field,
            req.body[error.field],
            error.message,
            {
              operation: "UPDATE_USER_PROFILE",
              userId: req.userAuthId,
            }
          );
        });

        educademyLogger.logBusinessOperation(
          "UPDATE_USER_PROFILE",
          "USER",
          req.userAuthId,
          "VALIDATION_FAILED",
          { validationErrors: validationErrors.map((e) => e.field) }
        );

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      educademyLogger.info("Finding user for profile update", {
        business: {
          operation: "USER_LOOKUP",
          entity: "USER",
          entityId: req.userAuthId,
          status: "FINDING",
        },
        database: {
          operation: "SELECT",
          table: "users",
          lookupField: "id",
        },
      });

      const currentUser = await prisma.user.findUnique({
        where: { id: req.userAuthId },
        include: {
          studentProfile: true,
          instructorProfile: true,
          adminProfile: true,
        },
      });

      if (!currentUser) {
        // Clean up uploaded file if user not found
        if (req.file?.filename) {
          try {
            await deleteFromCloudinary(req.file.filename);
          } catch (deleteError) {
            educademyLogger.warn(
              "Failed to cleanup uploaded file after user not found",
              {
                error: deleteError,
                filename: req.file.filename,
              }
            );
          }
        }

        educademyLogger.error("User not found for profile update", null, {
          userId: req.userAuthId,
          business: {
            operation: "UPDATE_USER_PROFILE",
            entity: "USER",
            entityId: req.userAuthId,
            status: "USER_NOT_FOUND",
          },
        });

        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Build update data object with only provided fields
      const updateData = {};

      if (firstName !== undefined) updateData.firstName = firstName.trim();
      if (lastName !== undefined) updateData.lastName = lastName.trim();
      if (bio !== undefined) updateData.bio = bio?.trim() || null;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (language !== undefined) updateData.language = language;
      if (country !== undefined) updateData.country = country || null;
      if (phoneNumber !== undefined)
        updateData.phoneNumber = phoneNumber || null;
      if (dateOfBirth !== undefined)
        updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      if (website !== undefined) updateData.website = website || null;
      if (linkedinProfile !== undefined)
        updateData.linkedinProfile = linkedinProfile || null;
      if (twitterProfile !== undefined)
        updateData.twitterProfile = twitterProfile || null;
      if (githubProfile !== undefined)
        updateData.githubProfile = githubProfile || null;

      // Handle profile image updates
      let profileImageUpdated = false;
      let oldProfileImage = currentUser.profileImage;

      if (hasNewProfileImage) {
        // New profile image uploaded
        updateData.profileImage = req.file.path;
        profileImageUpdated = true;

        educademyLogger.logBusinessOperation(
          "UPDATE_PROFILE_IMAGE",
          "USER",
          req.userAuthId,
          "NEW_IMAGE_UPLOADED",
          {
            oldImage: oldProfileImage,
            newImage: req.file.path,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
          }
        );
      } else if (shouldRemoveImage && currentUser.profileImage) {
        // Remove existing profile image
        updateData.profileImage = null;
        profileImageUpdated = true;

        educademyLogger.logBusinessOperation(
          "REMOVE_PROFILE_IMAGE",
          "USER",
          req.userAuthId,
          "IMAGE_REMOVED",
          { removedImage: oldProfileImage }
        );
      }

      // Store old values for audit trail (including profile image)
      const oldValues = {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        bio: currentUser.bio,
        timezone: currentUser.timezone,
        language: currentUser.language,
        country: currentUser.country,
        phoneNumber: currentUser.phoneNumber,
        dateOfBirth: currentUser.dateOfBirth,
        website: currentUser.website,
        linkedinProfile: currentUser.linkedinProfile,
        twitterProfile: currentUser.twitterProfile,
        githubProfile: currentUser.githubProfile,
        profileImage: currentUser.profileImage,
      };

      const fieldsToUpdate = Object.keys(updateData);

      if (fieldsToUpdate.length === 0 && !profileData) {
        // Clean up uploaded file if no updates to make
        if (req.file?.filename) {
          try {
            await deleteFromCloudinary(req.file.filename);
          } catch (deleteError) {
            educademyLogger.warn(
              "Failed to cleanup uploaded file when no updates needed",
              {
                error: deleteError,
                filename: req.file.filename,
              }
            );
          }
        }

        educademyLogger.logBusinessOperation(
          "UPDATE_USER_PROFILE",
          "USER",
          req.userAuthId,
          "NO_CHANGES",
          { message: "No fields provided for update" }
        );

        return res.status(400).json({
          success: false,
          message: "No fields provided for update",
        });
      }

      let updatedUser = currentUser;
      let profileUpdateResult = null;

      // Update main user profile if there are fields to update
      if (fieldsToUpdate.length > 0) {
        educademyLogger.info("Updating user profile", {
          business: {
            operation: "USER_UPDATE",
            entity: "USER",
            entityId: req.userAuthId,
            status: "UPDATING",
          },
          database: {
            operation: "UPDATE",
            table: "users",
          },
        });

        updatedUser = await prisma.user.update({
          where: { id: req.userAuthId },
          data: updateData,
          include: {
            studentProfile: true,
            instructorProfile: true,
            adminProfile: true,
            notificationSettings: true,
          },
        });

        educademyLogger.logBusinessOperation(
          "UPDATE_USER_PROFILE",
          "USER",
          req.userAuthId,
          "SUCCESS",
          {
            updatedFields: fieldsToUpdate,
            totalFields: fieldsToUpdate.length,
            profileImageUpdated,
          }
        );

        // Log audit trail for each changed field (including profile image)
        fieldsToUpdate.forEach((field) => {
          if (oldValues[field] !== updateData[field]) {
            educademyLogger.logAuditTrail(
              "UPDATE_USER_FIELD",
              "USER",
              req.userAuthId,
              field === "profileImage" ? "[IMAGE_PATH]" : oldValues[field],
              field === "profileImage" ? "[NEW_IMAGE_PATH]" : updateData[field],
              req.userAuthId
            );
          }
        });

        // Clean up old profile image from cloud storage if a new one was uploaded
        if (hasNewProfileImage && oldProfileImage) {
          try {
            const publicId = oldProfileImage.split("/").pop().split(".")[0];
            await deleteFromCloudinary(`educademy/profiles/${publicId}`);

            educademyLogger.logBusinessOperation(
              "DELETE_OLD_PROFILE_IMAGE",
              "PROFILE_IMAGE",
              req.userAuthId,
              "SUCCESS",
              { deletedImage: oldProfileImage }
            );
          } catch (deleteError) {
            educademyLogger.warn(
              "Failed to delete old profile image from cloud storage",
              {
                error: deleteError,
                userId: req.userAuthId,
                oldImageUrl: oldProfileImage,
              }
            );
          }
        }

        // Clean up old profile image if it was removed
        if (shouldRemoveImage && oldProfileImage) {
          try {
            const publicId = oldProfileImage.split("/").pop().split(".")[0];
            await deleteFromCloudinary(`educademy/profiles/${publicId}`);

            educademyLogger.logBusinessOperation(
              "DELETE_REMOVED_PROFILE_IMAGE",
              "PROFILE_IMAGE",
              req.userAuthId,
              "SUCCESS",
              { deletedImage: oldProfileImage }
            );
          } catch (deleteError) {
            educademyLogger.warn(
              "Failed to delete removed profile image from cloud storage",
              {
                error: deleteError,
                userId: req.userAuthId,
                oldImageUrl: oldProfileImage,
              }
            );
          }
        }
      }

      // Update role-specific profile data
      if (profileData && typeof profileData === "object") {
        const userRole = currentUser.role;

        educademyLogger.info(
          `Updating ${userRole.toLowerCase()} profile data`,
          {
            business: {
              operation: "PROFILE_UPDATE",
              entity: `${userRole}_PROFILE`,
              entityId: req.userAuthId,
              status: "UPDATING",
            },
            database: {
              operation: "UPDATE",
              table: userRole.toLowerCase(),
            },
          }
        );

        try {
          switch (userRole) {
            case "STUDENT":
              const studentUpdateData = {};

              if (profileData.learningGoals !== undefined) {
                studentUpdateData.learningGoals = Array.isArray(
                  profileData.learningGoals
                )
                  ? profileData.learningGoals
                  : [];
              }

              if (profileData.interests !== undefined) {
                studentUpdateData.interests = Array.isArray(
                  profileData.interests
                )
                  ? profileData.interests
                  : [];
              }

              if (profileData.skillLevel !== undefined) {
                const validSkillLevels = [
                  "BEGINNER",
                  "INTERMEDIATE",
                  "ADVANCED",
                  "EXPERT",
                ];
                if (validSkillLevels.includes(profileData.skillLevel)) {
                  studentUpdateData.skillLevel = profileData.skillLevel;
                }
              }

              if (Object.keys(studentUpdateData).length > 0) {
                profileUpdateResult = await prisma.student.update({
                  where: { userId: req.userAuthId },
                  data: studentUpdateData,
                });

                educademyLogger.logAuditTrail(
                  "UPDATE_STUDENT_PROFILE",
                  "STUDENT_PROFILE",
                  req.userAuthId,
                  currentUser.studentProfile,
                  studentUpdateData,
                  req.userAuthId
                );
              }
              break;

            case "INSTRUCTOR":
              const instructorUpdateData = {};

              if (profileData.title !== undefined) {
                instructorUpdateData.title = profileData.title?.trim() || null;
              }

              if (profileData.expertise !== undefined) {
                instructorUpdateData.expertise = Array.isArray(
                  profileData.expertise
                )
                  ? profileData.expertise
                  : [];
              }

              if (profileData.yearsExperience !== undefined) {
                const years = parseInt(profileData.yearsExperience);
                if (!isNaN(years) && years >= 0 && years <= 50) {
                  instructorUpdateData.yearsExperience = years;
                }
              }

              if (profileData.education !== undefined) {
                instructorUpdateData.education =
                  profileData.education?.trim() || null;
              }

              if (profileData.certifications !== undefined) {
                instructorUpdateData.certifications = Array.isArray(
                  profileData.certifications
                )
                  ? profileData.certifications
                  : [];
              }

              if (profileData.biography !== undefined) {
                instructorUpdateData.biography =
                  profileData.biography?.trim() || null;
              }

              if (Object.keys(instructorUpdateData).length > 0) {
                profileUpdateResult = await prisma.instructor.update({
                  where: { userId: req.userAuthId },
                  data: instructorUpdateData,
                });

                educademyLogger.logAuditTrail(
                  "UPDATE_INSTRUCTOR_PROFILE",
                  "INSTRUCTOR_PROFILE",
                  req.userAuthId,
                  currentUser.instructorProfile,
                  instructorUpdateData,
                  req.userAuthId
                );
              }
              break;

            case "ADMIN":
              const adminUpdateData = {};

              if (profileData.department !== undefined) {
                adminUpdateData.department =
                  profileData.department?.trim() || null;
              }

              if (Object.keys(adminUpdateData).length > 0) {
                profileUpdateResult = await prisma.admin.update({
                  where: { userId: req.userAuthId },
                  data: adminUpdateData,
                });

                educademyLogger.logAuditTrail(
                  "UPDATE_ADMIN_PROFILE",
                  "ADMIN_PROFILE",
                  req.userAuthId,
                  currentUser.adminProfile,
                  adminUpdateData,
                  req.userAuthId
                );
              }
              break;

            default:
              educademyLogger.warn("Unknown user role for profile update", {
                userId: req.userAuthId,
                role: userRole,
              });
              break;
          }

          if (profileUpdateResult) {
            educademyLogger.logBusinessOperation(
              "UPDATE_ROLE_PROFILE",
              `${userRole}_PROFILE`,
              req.userAuthId,
              "SUCCESS",
              { role: userRole }
            );
          }
        } catch (profileError) {
          educademyLogger.error(
            `Failed to update ${userRole.toLowerCase()} profile`,
            profileError,
            {
              userId: req.userAuthId,
              role: userRole,
              business: {
                operation: "UPDATE_ROLE_PROFILE",
                entity: `${userRole}_PROFILE`,
                entityId: req.userAuthId,
                status: "ERROR",
              },
            }
          );

          // Don't fail the entire request, just log the error
          educademyLogger.warn(
            "Profile data update failed, but user update succeeded",
            {
              userId: req.userAuthId,
              error: profileError.message,
            }
          );
        }
      }

      // Get the final updated user data
      const finalUser = await prisma.user.findUnique({
        where: { id: req.userAuthId },
        include: {
          studentProfile: true,
          instructorProfile: true,
          adminProfile: true,
          notificationSettings: true,
        },
      });

      educademyLogger.logBusinessOperation(
        "UPDATE_USER_PROFILE_COMPLETE",
        "USER",
        req.userAuthId,
        "SUCCESS",
        {
          mainProfileUpdated: fieldsToUpdate.length > 0,
          roleProfileUpdated: !!profileUpdateResult,
          totalUpdatedFields: fieldsToUpdate.length,
          profileImageUpdated,
          imageAction: hasNewProfileImage
            ? "UPLOADED"
            : shouldRemoveImage
            ? "REMOVED"
            : "UNCHANGED",
        }
      );

      educademyLogger.performance("UPDATE_USER_PROFILE", startTime, {
        userId: req.userAuthId,
        totalQueries:
          fieldsToUpdate.length > 0 ? (profileUpdateResult ? 3 : 2) : 1,
        fieldsUpdated: fieldsToUpdate.length,
        profileUpdated: !!profileUpdateResult,
        imageUpdated: profileImageUpdated,
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "updateUserProfile",
        true,
        performance.now() - startTime
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: finalUser.id,
          firstName: finalUser.firstName,
          lastName: finalUser.lastName,
          email: finalUser.email,
          role: finalUser.role,
          profileImage: finalUser.profileImage,
          bio: finalUser.bio,
          isVerified: finalUser.isVerified,
          isActive: finalUser.isActive,
          timezone: finalUser.timezone,
          language: finalUser.language,
          country: finalUser.country,
          phoneNumber: finalUser.phoneNumber,
          dateOfBirth: finalUser.dateOfBirth,
          website: finalUser.website,
          linkedinProfile: finalUser.linkedinProfile,
          twitterProfile: finalUser.twitterProfile,
          githubProfile: finalUser.githubProfile,
          lastLogin: finalUser.lastLogin,
          createdAt: finalUser.createdAt,
          updatedAt: finalUser.updatedAt,
          profile:
            finalUser.role === "STUDENT"
              ? finalUser.studentProfile
              : finalUser.role === "INSTRUCTOR"
              ? finalUser.instructorProfile
              : finalUser.adminProfile,
          notificationSettings: finalUser.notificationSettings,
        },
        updatedFields: fieldsToUpdate,
        profileDataUpdated: !!profileUpdateResult,
        profileImageUpdated,
        imageAction: hasNewProfileImage
          ? "uploaded"
          : shouldRemoveImage
          ? "removed"
          : "unchanged",
      });
    } catch (error) {
      // Clean up uploaded file if error occurs
      if (req.file?.filename) {
        try {
          await deleteFromCloudinary(req.file.filename);
        } catch (deleteError) {
          educademyLogger.warn("Failed to cleanup uploaded file after error", {
            error: deleteError,
            filename: req.file.filename,
          });
        }
      }

      educademyLogger.error("Profile update failed", error, {
        userId: req.userAuthId,
        business: {
          operation: "UPDATE_USER_PROFILE",
          entity: "USER",
          entityId: req.userAuthId,
          status: "ERROR",
        },
        request: {
          body: req.body,
          hasFile: !!req.file,
          clientIp: req.ip,
          userAgent: req.get("User-Agent"),
        },
      });

      educademyLogger.logMethodExit(
        "AuthController",
        "updateUserProfile",
        false,
        performance.now() - startTime
      );

      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        requestId: requestId,
      });
    }
  });
});
