import express from "express";
import cors from "cors";
import { createServer } from "http";
import { config } from "dotenv";
import socketManager from "./utils/socket-io.js";
import authRoutes from "./routes/auth.route.js";
import {
  errorHandler,
  notFound,
  validationErrorHandler,
  databaseErrorHandler,
  authErrorHandler,
  rateLimitErrorHandler,
} from "./middlewares/errorHandler.js";
import { httpLoggerMiddleware } from "./utils/logger.js";
import educademyLogger from "./utils/logger.js";

config();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173", // Vite default port
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean); // Remove undefined values

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-CSRF-Token",
  ],
  exposedHeaders: ["set-cookie"],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

educademyLogger.start("Educademy Backend Server", {
  port: PORT,
  environment: process.env.NODE_ENV,
  nodeVersion: process.version,
  logConfig: educademyLogger.getConfig(),
});

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(httpLoggerMiddleware);

const io = socketManager.init(server);

app.set("socketManager", socketManager);

app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connectedUsers: socketManager.getConnectedUsersCount(),
    environment: process.env.NODE_ENV,
  };

  educademyLogger.info("Health check requested", healthData);

  res.status(200).json(healthData);
});

// Socket.IO status endpoint
app.get("/socket-status", (req, res) => {
  const socketStatus = {
    connectedUsers: socketManager.getConnectedUsersCount(),
    totalConnections: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(socketStatus);
});

// =============================================
// ERROR HANDLING MIDDLEWARE
// =============================================
app.use(validationErrorHandler);
app.use(databaseErrorHandler);
app.use(authErrorHandler);
app.use(rateLimitErrorHandler);
app.use(notFound);
app.use(errorHandler);

// =============================================
// GRACEFUL SHUTDOWN HANDLING
// =============================================
const gracefulShutdown = (signal) => {
  educademyLogger.info(`${signal} received, shutting down gracefully`, {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    connectedUsers: socketManager.getConnectedUsersCount(),
  });

  // Close server first
  server.close((err) => {
    if (err) {
      educademyLogger.error("Error during server shutdown", err);
      process.exit(1);
    }

    // Close Socket.IO connections
    io.close((err) => {
      if (err) {
        educademyLogger.error("Error closing Socket.IO", err);
        process.exit(1);
      }

      educademyLogger.success("Server shutdown completed successfully");
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    educademyLogger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  educademyLogger.fatal("Uncaught Exception", error, {
    connectedUsers: socketManager.getConnectedUsersCount(),
  });
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  educademyLogger.fatal("Unhandled Rejection", null, {
    reason: reason?.toString(),
    promise: promise?.toString(),
    connectedUsers: socketManager.getConnectedUsersCount(),
  });
  gracefulShutdown("UNHANDLED_REJECTION");
});

server.listen(PORT, () => {
  educademyLogger.success(`🚀 Educademy Server running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    pid: process.pid,
    socketIO: "enabled",
    cors: process.env.FRONTEND_URL || "http://localhost:3000",
  });

  educademyLogger.success("🔌 Socket.IO server ready for connections", {
    cors: process.env.FRONTEND_URL || "http://localhost:3000",
    pingTimeout: 60000,
    pingInterval: 25000,
  });
});

export default app;
export { socketManager };
