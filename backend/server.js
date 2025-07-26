import express from "express";
import cors from "cors";
import session from "express-session";
import { RedisStore } from "connect-redis";
import passport from "passport";
import { createServer } from "http";
import { config } from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import timeout from "connect-timeout";
import socketManager from "./utils/socket-io.js";
import redisService from "./utils/redis.js";
import {
  handleUnifiedWebhook,
  getWebhookStatus,
  testWebhook,
} from "./controllers/webhooks/unifiedWebhook.controller.js";
import authRoutes from "./routes/common/auth.route.js";
import notificationRoutes from "./routes/common/notification.route.js";
import uploadRoutes from "./routes/common/upload.route.js";
import searchRoutes from "./routes/common/search.route.js";
import supportRoutes from "./routes/common/ticket.route.js";
import adminAnalyticsRoutes from "./routes/admin/adminAnalytics.route.js";
import adminCourseRoutes from "./routes/admin/adminCourse.route.js";
import adminModerationRoutes from "./routes/admin/adminModeration.route.js";
import adminPaymentRoutes from "./routes/admin/adminPayment.route.js";
import adminSystemRoutes from "./routes/admin/adminSystem.route.js";
import adminUserRoutes from "./routes/admin/adminUser.route.js";
import instructorContentRoutes from "./routes/instructor/content.route.js";
import instructorCouponRoutes from "./routes/instructor/coupon.route.js";
import instructorEarningRoutes from "./routes/instructor/earning.route.js";
import instructorCommunityRoutes from "./routes/instructor/instructorCommunity.route.js";
import instructorVerificationRoutes from "./routes/instructor/verification.route.js";
import instructorCourseRoutes from "./routes/instructor/instructorCourse.route.js";
import instructorStudentRoutes from "./routes/instructor/instructorStudent.route.js";
import studentCartRoutes from "./routes/student/cart.route.js";
import studentCatalogRoutes from "./routes/student/catalog.route.js";
import studentCommunityRoutes from "./routes/student/community.route.js";
import studentLearningRoutes from "./routes/student/learning.route.js";
import studentPurchaseRoutes from "./routes/student/purchase.route.js";
import studentWishlistRoutes from "./routes/student/wishlist.route.js";
import prisma, { setPrismaRequest } from "./utils/prisma.js";
import {
  configureMorgan,
  setupDebugMiddleware,
  errorCaptureMiddleware,
  globalRequestMiddleware,
} from "./utils/morgan.js";
import {
  errorHandler,
  notFound,
  validationErrorHandler,
  databaseErrorHandler,
  authErrorHandler,
} from "./middlewares/errorHandler.js";
import "./utils/passport.js";
import notificationService from "./utils/notificationservice.js";

config();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      process.env.INSTRUCTOR_URL,
    ].filter(Boolean);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-CSRF-Token",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  exposedHeaders: [
    "set-cookie",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
  ],
  optionsSuccessStatus: 200,
};

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
notificationService.setSocketManager(socketManager);

console.log(`🚀 Starting Educademy Backend Server on port ${PORT}`);
console.log(`📦 Environment: ${process.env.NODE_ENV}`);
console.log(`🔧 Node.js Version: ${process.version}`);

const configureServerTimeouts = (server) => {
  server.timeout = 600000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  console.log("✅ Server timeouts configured for slow APIs:");
  console.log(`   - Request timeout: ${server.timeout / 1000}s`);
  console.log(`   - Keep-alive timeout: ${server.keepAliveTimeout / 1000}s`);
  console.log(`   - Headers timeout: ${server.headersTimeout / 1000}s`);
};

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:"],
      },
    },
  })
);

try {
  const initializeBackgroundJobs = await import(
    "./config/services/courseCountJobs.js"
  ).then((module) => module.default);
  initializeBackgroundJobs();
} catch (error) {
  console.warn("Background jobs initialization failed:", error.message);
  console.log(
    "Server will continue without background jobs - database triggers will handle count updates"
  );
}

app.use(compression());

setupDebugMiddleware(app);

app.use(globalRequestMiddleware);
app.use(setPrismaRequest);
configureMorgan(app);

const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,

  message: {
    success: false,
    error: {
      message: "Too many requests from this IP",
      details: "Rate limit exceeded. Please try again later.",
      retryAfter: "15 minutes",
    },
    timestamp: new Date().toISOString(),
  },

  standardHeaders: true,
  legacyHeaders: false,

  skip: (req) => {
    const whitelist = ["127.0.0.1", "::1"];
    return process.env.NODE_ENV !== "production" && whitelist.includes(req.ip);
  },

  handler: (req, res) => {
    console.warn(
      `Rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`
    );

    res.status(429).json({
      success: false,
      error: {
        message: "Too many requests from this IP",
        details: "Rate limit exceeded. Please try again later.",
        retryAfter: "15 minutes",
        limit: req.rateLimit.limit,
        remaining: req.rateLimit.remaining,
        resetTime: new Date(Date.now() + req.rateLimit.resetTime),
      },
      timestamp: new Date().toISOString(),
    });
  },
});

const apiSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: () => 1000,
  maxDelayMs: 30000,

  skip: (req) => {
    const adminRoutes = [
      "/api/admin/users/users",
      "/api/admin/users/",
      "/api/admin/categories",
      "/api/admin/analytics",
    ];

    return adminRoutes.some((route) => req.originalUrl.includes(route));
  },
});

app.use(cors(corsOptions));

const io = socketManager.init(server);

app.set("socketManager", socketManager);
app.set("redisService", redisService);

app.post(
  "/api/webhook/payment",
  express.raw({ type: "application/json" }),
  handleUnifiedWebhook
);

app.get("/api/webhook/payment/status", getWebhookStatus);

app.post("/api/webhook/payment/test", express.json(), testWebhook);

app.use(timeout("600s"));

app.use((req, res, next) => {
  if (!req.timedout) {
    next();
  } else {
    console.error(`Request timeout: ${req.method} ${req.originalUrl}`);
    res.status(408).json({
      success: false,
      message: "Request timeout - operation took too long",
      code: "REQUEST_TIMEOUT",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const redisStore = new RedisStore({
  client: redisService.redis,
  prefix: "educademy:sess:",
  ttl: 24 * 60 * 60,
  touchAfter: 24 * 3600,
  disableTouch: false,
  disableTTL: false,
});

redisStore.on("error", (error) => {
  console.error("Redis session store error:", error);
});

redisStore.on("connect", () => {
  console.log("Redis session store connected");
});

redisStore.on("disconnect", () => {
  console.log("Redis session store disconnected");
});

app.use(
  session({
    store: redisStore,
    secret:
      process.env.SESSION_SECRET ||
      "educademy-session-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    },
    name: "educademy.sid",
  })
);

app.use(passport.initialize());
app.use(passport.session());

if (process.env.NODE_ENV === "production") {
  app.use(globalRateLimit);
}
app.use(apiSlowDown);

app.use((req, res, next) => {
  req.redisService = redisService;
  req.socketManager = socketManager;
  req.prisma = prisma;
  next();
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Educademy API Server is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    connectedUsers: socketManager.getConnectedUsersCount(),
    redis: redisService.getConnectionStatus(),
    serverTimeouts: {
      request: server.timeout / 1000 + "s",
      keepAlive: server.keepAliveTimeout / 1000 + "s",
      headers: server.headersTimeout / 1000 + "s",
    },
  });
});

app.get("/health", async (req, res) => {
  const healthCheck = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
    services: {
      redis: redisService.getConnectionStatus(),
      database: "connected",
      socketio: {
        status: "connected",
        connectedUsers: socketManager.getConnectedUsersCount(),
        activeRooms: socketManager.getSystemStats().activeRooms,
      },
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      external:
        Math.round(process.memoryUsage().external / 1024 / 1024) + " MB",
    },
    cpu: process.cpuUsage(),
    timeouts: {
      server: server.timeout / 1000 + "s",
      keepAlive: server.keepAliveTimeout / 1000 + "s",
      headers: server.headersTimeout / 1000 + "s",
    },
  };

  try {
    await redisService.healthCheck();
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.status = "ERROR";
    healthCheck.services.redis.isConnected = false;
    res.status(503).json(healthCheck);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/support", supportRoutes);

app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/courses", adminCourseRoutes);
app.use("/api/admin/moderation", adminModerationRoutes);
app.use("/api/admin/payments", adminPaymentRoutes);
app.use("/api/admin/system", adminSystemRoutes);
app.use("/api/admin/users", adminUserRoutes);

app.use("/api/instructor/content", instructorContentRoutes);
app.use("/api/instructor/coupons", instructorCouponRoutes);
app.use("/api/instructor/earnings", instructorEarningRoutes);
app.use("/api/instructor/community", instructorCommunityRoutes);
app.use("/api/instructor/verification", instructorVerificationRoutes);
app.use("/api/instructor/courses", instructorCourseRoutes);
app.use("/api/instructor/students", instructorStudentRoutes);

app.use("/api/student/cart", studentCartRoutes);
app.use("/api/student/catalog", studentCatalogRoutes);
app.use("/api/student/community", studentCommunityRoutes);
app.use("/api/student/learning", studentLearningRoutes);
app.use("/api/student/purchase", studentPurchaseRoutes);
app.use("/api/student/wishlist", studentWishlistRoutes);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const timeoutErrorHandler = (error, req, res, next) => {
  if (error.code === "ETIMEDOUT" || error.timeout || req.timedout) {
    console.error("Operation timeout:", {
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
      timeout: req.timeout,
    });

    return res.status(408).json({
      success: false,
      message: "Operation timeout - the request took too long to complete",
      code: "OPERATION_TIMEOUT",
      details:
        "This usually happens with complex database operations. Please try again or contact support if the issue persists.",
      timestamp: new Date().toISOString(),
    });
  }
  next(error);
};

app.use(errorCaptureMiddleware);
app.use(timeoutErrorHandler);
app.use(validationErrorHandler);
app.use(databaseErrorHandler);
app.use(authErrorHandler);
app.use(notFound);
app.use(errorHandler);

const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);
  console.log(`⏱️  Uptime: ${process.uptime()}s`);
  console.log(`👥 Connected users: ${socketManager.getConnectedUsersCount()}`);

  server.close((err) => {
    if (err) {
      console.error("❌ Error during server shutdown:", err);
      process.exit(1);
    }

    io.close(async (err) => {
      if (err) {
        console.error("❌ Error closing Socket.IO:", err);
        process.exit(1);
      }

      try {
        console.log("🔄 Cleaning up Redis connections...");
        await redisService.flushall();
        console.log("✅ Redis cleanup completed");

        console.log("🔄 Disconnecting Prisma client...");
        await prisma.$disconnect();
        console.log("✅ Prisma cleanup completed");
      } catch (error) {
        console.error("❌ Cleanup error:", error);
      }

      console.log("✅ Server shutdown completed successfully");
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error("⏰ Forced shutdown after timeout");
    process.exit(1);
  }, 60000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  console.error(
    `👥 Connected users: ${socketManager.getConnectedUsersCount()}`
  );
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚫 Unhandled Rejection:", reason);
  console.error(
    `👥 Connected users: ${socketManager.getConnectedUsersCount()}`
  );
  gracefulShutdown("UNHANDLED_REJECTION");
});

process.on("warning", (warning) => {
  console.warn("⚠️  Warning:", warning.name, warning.message);
});

process.on("exit", (code) => {
  console.log(`🏁 Process exited with code: ${code}`);
});

const memoryUsageInterval = setInterval(() => {
  const used = process.memoryUsage();
  const memoryUsageMB = Math.round(used.heapUsed / 1024 / 1024);

  if (memoryUsageMB > 1024) {
    console.warn(`⚠️  High memory usage: ${memoryUsageMB}MB`);
  }

  if (global.gc && memoryUsageMB > 512) {
    global.gc();
  }
}, 300000);

const healthCheckInterval = setInterval(async () => {
  try {
    await redisService.healthCheck();

    const stats = socketManager.getSystemStats();
    if (stats.connectedUsers > 1000) {
      console.log(`📊 High connection count: ${stats.connectedUsers} users`);
    }

    console.log(
      `🕐 Server timeouts - Request: ${server.timeout / 1000}s, KeepAlive: ${
        server.keepAliveTimeout / 1000
      }s`
    );
  } catch (error) {
    console.error("🔍 Health check failed:", error);
  }
}, 300000);

configureServerTimeouts(server);

server.listen(PORT, () => {
  console.log(`🚀 Educademy Server running on port ${PORT}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
  console.log(`🆔 Process ID: ${process.pid}`);
  console.log(`🔌 Socket.IO: enabled`);
  console.log(
    `🔗 CORS: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
  console.log(
    `💾 Redis: ${
      redisService.getConnectionStatus().isConnected
        ? "connected"
        : "disconnected"
    }`
  );
  console.log(`🛡️  Security: Helmet enabled`);
  console.log(`⚡ Compression: enabled`);
  console.log(
    `🚦 Rate limiting: ${
      process.env.NODE_ENV === "production"
        ? "enabled"
        : "disabled in development"
    }`
  );
  console.log("🔌 Socket.IO server ready for connections");
  console.log(`⚡ Ping timeout: 60000ms, interval: 25000ms`);
  console.log(`🎯 Unified webhook endpoint: /api/webhook/payment`);
  console.log(
    `⏱️  Server configured for slow APIs (${server.timeout / 1000}s timeout)`
  );

  if (process.env.NODE_ENV === "production") {
    console.log("🔒 Production security features enabled");
  } else {
    console.log(
      "🛠️  Development mode - additional logging enabled, rate limiting disabled"
    );
  }
});

process.on("beforeExit", () => {
  clearInterval(memoryUsageInterval);
  clearInterval(healthCheckInterval);
});

export default app;
export { socketManager, redisService, prisma };
