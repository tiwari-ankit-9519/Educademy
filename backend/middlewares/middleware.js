import { config } from "dotenv";
config();
import jwt from "jsonwebtoken";
import getTokenFromHeader from "../utils/getTokenFromHeader.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const isLoggedIn = async (req, res, next) => {
  const token = getTokenFromHeader(req);

  console.log("Extracted Token: ", token);

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded Token: ", decoded);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        isActive: true,
        isVerified: true,
        adminProfile: {
          select: {
            id: true,
            permissions: true,
            department: true,
          },
        },
        instructorProfile: {
          select: {
            id: true,
            isVerified: true,
          },
        },
      },
    });

    console.log("User: ", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is deactivated. Contact support.",
      });
    }

    req.userAuthId = user.id;
    req.userRole = user.role;
    req.userProfile = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (!req.userAuthId || !req.userRole) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(req.userRole)) {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    return res.status(500).json({
      message: "Authorization verification failed",
    });
  }
};

const isInstructor = async (req, res, next) => {
  try {
    if (!req.userAuthId || !req.userRole) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (req.userRole !== "INSTRUCTOR") {
      return res.status(403).json({
        message: "Access denied. Instructor privileges required.",
      });
    }

    if (!req.userProfile?.instructorProfile) {
      return res.status(403).json({
        message:
          "Instructor profile not found. Complete your instructor setup.",
      });
    }

    const instructorProfile = await prisma.instructor.findUnique({
      where: { userId: req.userAuthId },
      select: {
        id: true,
        isVerified: true,
        user: {
          select: {
            isActive: true,
            isVerified: true,
          },
        },
      },
    });

    if (!instructorProfile) {
      return res.status(403).json({
        message:
          "Instructor profile not found. Complete your instructor application.",
      });
    }

    if (!instructorProfile.user.isVerified) {
      return res.status(403).json({
        message: "Account pending email verification.",
      });
    }

    if (!instructorProfile.isVerified) {
      return res.status(403).json({
        message: "Instructor profile pending admin approval.",
      });
    }

    req.instructorProfile = instructorProfile;
    next();
  } catch (error) {
    console.error("Instructor authorization error:", error);
    return res.status(500).json({
      message: "Authorization verification failed",
    });
  }
};

const requireAdmin = [isLoggedIn, isAdmin];
const requireInstructor = [isLoggedIn, isInstructor];

export default isLoggedIn;
export { isAdmin, isInstructor, requireAdmin, requireInstructor };
