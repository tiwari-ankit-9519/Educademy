import syslogLogger from "../utils/logger.js";
import { PrismaClient } from "@prisma/client";

const createPrismaClient = () => {
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

  // Enhanced Prisma query logging with syslog format
  prisma.$on("query", (e) => {
    // Development debug output (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 FULL SQL:", e.query);
      console.log("📋 PARAMS:", e.params);
      console.log("⏱️ DURATION:", e.duration + "ms");
      console.log("---");
    }

    const queryLower = (e.query || "").toLowerCase().trim();
    let tableName = "unknown";
    let operation = "QUERY";
    let affectedRecords = "unknown";
    let queryTarget = e.target || "unknown";

    // Enhanced operation and table name parsing
    if (queryLower.includes("select")) {
      operation = "SELECT";

      const fromMatch =
        queryLower.match(/from\s+"?(\w+)"?\."?(\w+)"?/i) ||
        queryLower.match(/from\s+"?(\w+)"?/i);
      if (fromMatch) {
        tableName = fromMatch[2] || fromMatch[1];
      }

      const joinMatches =
        queryLower.match(/join\s+"?(\w+)"?\."?(\w+)"?/gi) ||
        queryLower.match(/join\s+"?(\w+)"?/gi);
      if (joinMatches && joinMatches.length > 0) {
        const joinTables = joinMatches.map((match) => {
          const tableMatch =
            match.match(/join\s+"?(\w+)"?\."?(\w+)"?/i) ||
            match.match(/join\s+"?(\w+)"?/i);
          return tableMatch ? tableMatch[2] || tableMatch[1] : "unknown";
        });
        tableName += ` (JOINS: ${joinTables.join(", ")})`;
      }

      const limitMatch = queryLower.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        affectedRecords = `up to ${limitMatch[1]}`;
      }
    } else if (queryLower.includes("insert")) {
      operation = "INSERT";

      const intoMatch =
        queryLower.match(/insert\s+into\s+"?(\w+)"?\."?(\w+)"?/i) ||
        queryLower.match(/insert\s+into\s+"?(\w+)"?/i);
      if (intoMatch) {
        tableName = intoMatch[2] || intoMatch[1];
      }

      const valuesMatches = queryLower.match(/values\s*\(/gi);
      if (valuesMatches) {
        affectedRecords = valuesMatches.length;
      } else {
        affectedRecords = 1;
      }
    } else if (queryLower.includes("update")) {
      operation = "UPDATE";

      const updateMatch =
        queryLower.match(/update\s+"?(\w+)"?\."?(\w+)"?/i) ||
        queryLower.match(/update\s+"?(\w+)"?/i);
      if (updateMatch) {
        tableName = updateMatch[2] || updateMatch[1];
      }
      affectedRecords = "variable";
    } else if (queryLower.includes("delete")) {
      operation = "DELETE";

      const deleteMatch =
        queryLower.match(/delete\s+from\s+"?(\w+)"?\."?(\w+)"?/i) ||
        queryLower.match(/delete\s+from\s+"?(\w+)"?/i);
      if (deleteMatch) {
        tableName = deleteMatch[2] || deleteMatch[1];
      }
      affectedRecords = "variable";
    } else if (
      queryLower.includes("begin") ||
      queryLower.includes("start transaction")
    ) {
      operation = "BEGIN_TRANSACTION";
      tableName = "transaction";
      affectedRecords = "n/a";
    } else if (queryLower.includes("commit")) {
      operation = "COMMIT";
      tableName = "transaction";
      affectedRecords = "n/a";
    } else if (queryLower.includes("rollback")) {
      operation = "ROLLBACK";
      tableName = "transaction";
      affectedRecords = "n/a";
    }

    // Extract WHERE conditions for better context
    let whereConditions = null;
    if (e.query) {
      const whereMatch = e.query.match(
        /WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|\s+OFFSET|$)/i
      );
      if (whereMatch) {
        whereConditions = whereMatch[1].trim();
        if (whereConditions.length > 100) {
          whereConditions = whereConditions.substring(0, 100) + "...";
        }
      }
    }

    // Determine log level based on operation and performance
    let logLevel = "debug";
    if (e.duration > 1000) {
      logLevel = "warn";
    } else if (e.duration > 500) {
      logLevel = "info";
    } else if (["CREATE_TABLE", "DROP_TABLE", "DELETE"].includes(operation)) {
      logLevel = "info";
    }

    // Get current context from syslog logger if available
    const currentContext = syslogLogger.requestId
      ? {
          requestId: syslogLogger.requestId,
          userId: syslogLogger.userId,
          className: syslogLogger.className,
          methodName: syslogLogger.methodName,
        }
      : {};

    // Log the database operation with syslog format
    syslogLogger[logLevel](
      `DATABASE ${operation}: ${tableName} (${e.duration}ms)`,
      {
        ...currentContext,
        business: {
          operation: "DATABASE_QUERY",
          entity: "DATABASE",
          status: "EXECUTED",
        },
        database: {
          operation: operation.toUpperCase(),
          table: tableName,
          duration: e.duration ? `${e.duration}ms` : null,
          affectedRecords,
          queryTarget,
        },
        performance: {
          operation: `DB_${operation}`,
          duration: `${e.duration}ms`,
          table: tableName,
        },
        sqlQuery: e.query,
        sqlParams: e.params,
        whereConditions,
        security: {
          event: "DATABASE_OPERATION",
          severity: e.duration > 1000 ? "MEDIUM" : "LOW",
          details: {
            operation,
            table: tableName,
            duration: e.duration,
          },
        },
      }
    );

    // Log slow queries with higher severity
    if (e.duration > 1000) {
      syslogLogger.businessOperation(
        "SLOW_QUERY_DETECTED",
        "DATABASE",
        null,
        "PERFORMANCE_ISSUE",
        {
          operation,
          table: tableName,
          duration: e.duration,
          threshold: "1000ms",
          query: e.query.substring(0, 200) + "...",
          context: currentContext,
        }
      );
    }
  });

  // Enhanced Prisma error logging
  prisma.$on("error", (e) => {
    let errorContext = {
      message: e.message,
      target: e.target,
      timestamp: new Date().toISOString(),
    };

    let errorType = "UNKNOWN_ERROR";
    let severity = "HIGH";

    if (e.message) {
      if (
        e.message.includes("duplicate key") ||
        e.message.includes("unique constraint")
      ) {
        errorType = "DUPLICATE_KEY_VIOLATION";
        severity = "MEDIUM";
        const constraintMatch = e.message.match(/constraint "([^"]+)"/);
        if (constraintMatch) {
          errorContext.constraint = constraintMatch[1];
        }
      } else if (e.message.includes("foreign key constraint")) {
        errorType = "FOREIGN_KEY_VIOLATION";
        severity = "MEDIUM";
        const constraintMatch = e.message.match(/constraint "([^"]+)"/);
        if (constraintMatch) {
          errorContext.constraint = constraintMatch[1];
        }
      } else if (e.message.includes("connection")) {
        errorType = "CONNECTION_ERROR";
        severity = "HIGH";
      } else if (e.message.includes("syntax error")) {
        errorType = "SYNTAX_ERROR";
        severity = "HIGH";
      } else if (e.message.includes("timeout")) {
        errorType = "TIMEOUT_ERROR";
        severity = "HIGH";
      } else if (
        e.message.includes("permission") ||
        e.message.includes("access")
      ) {
        errorType = "PERMISSION_ERROR";
        severity = "HIGH";
      }
    }

    // Get current context from syslog logger if available
    const currentContext = syslogLogger.requestId
      ? {
          requestId: syslogLogger.requestId,
          userId: syslogLogger.userId,
          className: syslogLogger.className,
          methodName: syslogLogger.methodName,
        }
      : {};

    syslogLogger.error("PRISMA DATABASE ERROR", e, {
      ...currentContext,
      business: {
        operation: "DATABASE_ERROR",
        entity: "PRISMA",
        status: "ERROR",
      },
      database: {
        operation: "ERROR",
        table: errorContext.target || "unknown",
        errorType,
      },
      error: {
        name: "PrismaError",
        message: e.message,
        target: e.target,
        code: e.code,
        constraint: errorContext.constraint,
      },
      security: {
        event: "DATABASE_ERROR",
        severity: severity,
        details: {
          errorType,
          target: e.target,
          hasConstraint: !!errorContext.constraint,
        },
      },
    });

    // Log critical errors with higher severity
    if (severity === "HIGH") {
      syslogLogger.securityEvent("DATABASE_CRITICAL_ERROR", severity, {
        errorType,
        message: e.message,
        target: e.target,
        code: e.code,
        context: currentContext,
      });
    }
  });

  // Prisma info logging
  prisma.$on("info", (e) => {
    const currentContext = syslogLogger.requestId
      ? {
          requestId: syslogLogger.requestId,
          userId: syslogLogger.userId,
        }
      : {};

    syslogLogger.info("PRISMA INFO", {
      ...currentContext,
      message: e.message,
      target: e.target,
      business: {
        operation: "DATABASE_INFO",
        entity: "PRISMA",
        status: "INFO",
      },
      database: {
        operation: "INFO",
        table: e.target || "system",
      },
    });
  });

  // Prisma warning logging
  prisma.$on("warn", (e) => {
    const currentContext = syslogLogger.requestId
      ? {
          requestId: syslogLogger.requestId,
          userId: syslogLogger.userId,
        }
      : {};

    syslogLogger.warn("PRISMA WARNING", {
      ...currentContext,
      message: e.message,
      target: e.target,
      business: {
        operation: "DATABASE_WARNING",
        entity: "PRISMA",
        status: "WARNING",
      },
      database: {
        operation: "WARNING",
        table: e.target || "system",
      },
    });
  });

  return prisma;
};

const prisma = createPrismaClient();

prisma
  .$connect()
  .then(() => {
    syslogLogger.info("Database connection established", {
      business: {
        operation: "DATABASE_CONNECTION",
        entity: "PRISMA",
        status: "CONNECTED",
      },
      database: {
        operation: "CONNECT",
        table: "system",
      },
      security: {
        event: "DATABASE_CONNECTION_SUCCESS",
        severity: "LOW",
        details: { timestamp: new Date().toISOString() },
      },
    });
  })
  .catch((error) => {
    syslogLogger.error("Database connection failed", error, {
      business: {
        operation: "DATABASE_CONNECTION",
        entity: "PRISMA",
        status: "CONNECTION_FAILED",
      },
      database: {
        operation: "CONNECT_ERROR",
        table: "system",
      },
      security: {
        event: "DATABASE_CONNECTION_FAILURE",
        severity: "HIGH",
        details: { error: error.message },
      },
    });
  });

process.on("beforeExit", async () => {
  syslogLogger.info("Disconnecting from database", {
    business: {
      operation: "DATABASE_DISCONNECTION",
      entity: "PRISMA",
      status: "DISCONNECTING",
    },
    database: {
      operation: "DISCONNECT",
      table: "system",
    },
  });

  await prisma.$disconnect();

  syslogLogger.info("Database disconnected successfully", {
    business: {
      operation: "DATABASE_DISCONNECTION",
      entity: "PRISMA",
      status: "DISCONNECTED",
    },
    database: {
      operation: "DISCONNECT",
      table: "system",
    },
  });
});

export default prisma;
