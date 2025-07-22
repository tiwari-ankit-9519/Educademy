import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.DEBUG_MODE === "true"
      ? ["query", "info", "warn", "error"]
      : ["error"],

  // Configure timeouts for slow operations
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },

  // Internal configuration for timeouts
  __internal: {
    engine: {
      requestTimeout: 300000, // 5 minutes for slow admin queries
      queryTimeout: 300000, // 5 minutes for individual queries
    },
  },
});

// Store current request directly
let currentRequest = null;

export const setPrismaRequest = (req, res, next) => {
  req.sqlQueries = req.sqlQueries || [];
  currentRequest = req;

  console.log(`🔗 Setting current request: ${req.headers["x-request-id"]}`);
  console.log(`📊 Method: ${req.method} ${req.originalUrl}`);
  console.log(`📊 sqlQueries initialized: ${Array.isArray(req.sqlQueries)}`);

  res.on("finish", () => {
    console.log(`🧹 Clearing current request: ${req.headers["x-request-id"]}`);
    currentRequest = null;
  });

  next();
};

prisma.$use(async (params, next) => {
  const startTime = Date.now();

  console.log(`🗄 Prisma Middleware: ${params.model}.${params.action}`);
  console.log(`📊 Current request exists: ${!!currentRequest}`);

  // Add timeout warning for slow queries
  const timeoutWarning = setTimeout(() => {
    console.warn(
      `⚠️  Slow query detected: ${params.model}.${params.action} taking longer than 30 seconds`
    );
  }, 30000);

  try {
    const result = await next(params);
    const duration = Date.now() - startTime;

    clearTimeout(timeoutWarning);

    const queryInfo = {
      model: params.model,
      action: params.action,
      args: params.args,
      duration,
      success: true,
      timestamp: new Date().toISOString(),
    };

    // Log slow queries
    if (duration > 5000) {
      // 5 seconds
      console.warn(
        `🐌 Slow query: ${params.model}.${params.action} took ${duration}ms`
      );
    }

    // Directly add to current request
    if (currentRequest && currentRequest.sqlQueries) {
      currentRequest.sqlQueries.push(queryInfo);
      console.log(
        `✅ Added query to current request. Total: ${currentRequest.sqlQueries.length}`
      );
      console.log(`📊 Query: ${params.model}.${params.action} (${duration}ms)`);
    } else {
      console.log(`⚠️  No current request to add query to!`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    clearTimeout(timeoutWarning);

    const queryInfo = {
      model: params.model,
      action: params.action,
      args: params.args,
      duration,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    console.error(
      `❌ Query failed: ${params.model}.${params.action} after ${duration}ms - ${error.message}`
    );

    if (currentRequest && currentRequest.sqlQueries) {
      currentRequest.sqlQueries.push(queryInfo);
      console.log(`❌ Added failed query to current request`);
    }

    throw error;
  }
});

prisma.$on("query", (e) => {
  const queryPreview =
    e.query.length > 100 ? e.query.substring(0, 100) + "..." : e.query;

  console.log(`🗄 Raw Query Event: ${queryPreview} (${e.duration}ms)`);

  // Warn about slow raw queries
  if (e.duration > 10000) {
    // 10 seconds
    console.warn(`🐌 Very slow raw query: ${e.duration}ms`);
  }

  const queryInfo = {
    type: "raw_query",
    query: e.query,
    params: e.params,
    duration: e.duration,
    timestamp: e.timestamp,
    target: e.target,
  };

  if (currentRequest && currentRequest.sqlQueries) {
    currentRequest.sqlQueries.push(queryInfo);
    console.log(
      `📝 Added raw query to current request. Total: ${currentRequest.sqlQueries.length}`
    );
  } else {
    console.log(`⚠️  No current request for raw query`);
  }
});

// Health check function for Prisma
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Graceful shutdown function
export const gracefulPrismaShutdown = async () => {
  console.log("🔄 Shutting down Prisma client...");
  try {
    await prisma.$disconnect();
    console.log("✅ Prisma client disconnected successfully");
  } catch (error) {
    console.error("❌ Error disconnecting Prisma client:", error);
    throw error;
  }
};

console.log(`🚀 Shared Prisma instance created with timeout configurations`);
console.log(`⏱️  Query timeout: 5 minutes`);
console.log(`🔍 Slow query threshold: 5 seconds`);

global.prisma = prisma;
export default prisma;
