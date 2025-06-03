import winston from "winston";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import os from "os";
import { performance } from "perf_hooks";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getLoggerConfig = () => {
  const env = process.env.NODE_ENV || "development";

  const configs = {
    development: {
      level: "trace",
      console: true,
      file: true,
      database: false,
      performance: true,
      colors: true,
      maxFileSize: "5MB",
      maxFiles: 5,
      dbCleanupDays: 7,
      logRequestBody: true,
      logResponseBody: false,
      logHeaders: true,
      logQueries: true,
      logStackTrace: true,
      logSqlParams: true,
    },
    production: {
      level: "info",
      console: false,
      file: true,
      database: true,
      performance: true,
      colors: false,
      maxFileSize: "10MB",
      maxFiles: 20,
      dbCleanupDays: 30,
      logRequestBody: true,
      logResponseBody: false,
      logHeaders: false,
      logQueries: true,
      logStackTrace: true,
      logSqlParams: false,
    },
    test: {
      level: "error",
      console: false,
      file: false,
      database: false,
      performance: false,
      colors: false,
      maxFileSize: "1MB",
      maxFiles: 1,
      dbCleanupDays: 1,
      logRequestBody: false,
      logResponseBody: false,
      logHeaders: false,
      logQueries: false,
      logStackTrace: true,
      logSqlParams: false,
    },
  };

  return configs[env] || configs.development;
};

const config = getLoggerConfig();
const prisma = config.database ? new PrismaClient() : null;

const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    http: 4,
    auth: 5,
    db: 6,
    payment: 7,
    enrollment: 8,
    course: 9,
    user: 10,
    debug: 11,
    trace: 12,
    query: 13,
    transaction: 14,
    validation: 15,
    business: 16,
    security: 17,
    audit: 18,
  },
  colors: {
    fatal: "red bold",
    error: "red",
    warn: "yellow",
    info: "cyan",
    http: "green",
    auth: "magenta",
    db: "blue",
    payment: "yellow bold",
    enrollment: "green bold",
    course: "cyan bold",
    user: "magenta bold",
    debug: "white",
    trace: "gray",
    query: "blue bold",
    transaction: "cyan bold",
    validation: "yellow",
    business: "green",
    security: "red bold",
    audit: "magenta bold",
  },
};

winston.addColors(customLevels.colors);

const LOG_ICONS = {
  fatal: "💀",
  error: "❌",
  warn: "⚠️",
  info: "ℹ️",
  http: "🌐",
  auth: "🔐",
  db: "🗄️",
  payment: "💳",
  enrollment: "📚",
  course: "🎓",
  user: "👤",
  debug: "🐛",
  trace: "🔍",
  query: "📊",
  transaction: "🔄",
  validation: "✅",
  business: "💼",
  security: "🛡️",
  audit: "📋",
  success: "✅",
  start: "🚀",
  stop: "🛑",
  performance: "⚡",
  email: "📧",
  file: "📁",
  api: "🔌",
};

const logsDir = path.join(__dirname, "../logs");
if (config.file && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const formatSqlQuery = (query) => {
  if (!query || typeof query !== "string") return query;

  return query
    .replace(/\s+/g, " ")
    .replace(/,\s*/g, ",\n        ")
    .replace(/\bSELECT\b/gi, "\n      SELECT")
    .replace(/\bFROM\b/gi, "\n      FROM")
    .replace(/\bWHERE\b/gi, "\n      WHERE")
    .replace(/\bAND\b/gi, "\n        AND")
    .replace(/\bOR\b/gi, "\n        OR")
    .replace(/\bORDER BY\b/gi, "\n      ORDER BY")
    .replace(/\bGROUP BY\b/gi, "\n      GROUP BY")
    .replace(/\bHAVING\b/gi, "\n      HAVING")
    .replace(/\bLIMIT\b/gi, "\n      LIMIT")
    .replace(/\bOFFSET\b/gi, "\n      OFFSET")
    .replace(/\bINSERT INTO\b/gi, "\n      INSERT INTO")
    .replace(/\bVALUES\b/gi, "\n      VALUES")
    .replace(/\bUPDATE\b/gi, "\n      UPDATE")
    .replace(/\bSET\b/gi, "\n      SET")
    .replace(/\bDELETE FROM\b/gi, "\n      DELETE FROM")
    .replace(/\bINNER JOIN\b/gi, "\n      INNER JOIN")
    .replace(/\bLEFT JOIN\b/gi, "\n      LEFT JOIN")
    .replace(/\bRIGHT JOIN\b/gi, "\n      RIGHT JOIN")
    .replace(/\bON\b/gi, "\n        ON")
    .trim();
};

const formatSqlParams = (params) => {
  if (!params || !Array.isArray(params) || params.length === 0) return null;

  return params
    .map((param, index) => {
      if (param === null) return `$${index + 1}: NULL`;
      if (typeof param === "string") return `$${index + 1}: '${param}'`;
      if (typeof param === "boolean") return `$${index + 1}: ${param}`;
      if (typeof param === "number") return `$${index + 1}: ${param}`;
      if (param instanceof Date)
        return `$${index + 1}: '${param.toISOString()}'`;
      return `$${index + 1}: ${JSON.stringify(param)}`;
    })
    .join("\n        ");
};

const safeStringify = (obj, maxDepth = 3, currentDepth = 0) => {
  if (currentDepth >= maxDepth) return "[Max Depth Reached]";

  if (obj === null) return "null";
  if (obj === undefined) return "undefined";

  if (typeof obj === "string") return obj;
  if (typeof obj === "number" || typeof obj === "boolean")
    return obj.toString();

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
      code: obj.code || "UNKNOWN",
    };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => safeStringify(item, maxDepth, currentDepth + 1));
  }

  if (typeof obj === "object") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        ["password", "token", "secret", "key", "authorization"].includes(
          key.toLowerCase()
        )
      ) {
        result[key] = "[MASKED]";
      } else {
        result[key] = safeStringify(value, maxDepth, currentDepth + 1);
      }
    }
    return result;
  }

  return obj.toString();
};

const consoleFormat = winston.format.combine(
  config.colors
    ? winston.format.colorize({ all: true })
    : winston.format.uncolorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const cleanLevel = level.replace(/\u001b\[[0-9;]*m/g, "");
    const icon = LOG_ICONS[cleanLevel] || "📝";

    let logMessage = `${timestamp} [${cleanLevel.toUpperCase().padEnd(11)}] [${
      process.pid
    }] [${meta.requestId || "NO-REQ-ID"}] ${icon} ${message}`;

    if (meta.method && meta.endpoint) {
      logMessage += `\n    ├─ ${meta.method} ${meta.endpoint} [${
        meta.statusCode || "PROCESSING"
      }]`;
      if (meta.duration) logMessage += ` (${meta.duration}ms)`;
    }

    if (meta.userId) {
      logMessage += `\n    ├─ USER: ${meta.userId}${
        meta.email ? ` (${meta.email})` : ""
      }`;
    }

    if (meta.request?.body && config.logRequestBody) {
      logMessage += `\n    ├─ REQUEST BODY: ${JSON.stringify(
        safeStringify(meta.request.body),
        null,
        2
      )}`;
    }

    if (meta.request?.query && Object.keys(meta.request.query).length > 0) {
      logMessage += `\n    ├─ QUERY PARAMS: ${JSON.stringify(
        meta.request.query
      )}`;
    }

    if (meta.database) {
      logMessage += `\n    ├─ DB ${meta.database.operation}: ${meta.database.table}`;
      if (meta.database.duration)
        logMessage += ` (${meta.database.duration}ms)`;
    }

    if (meta.sqlQuery && config.logQueries) {
      logMessage += `\n    ├─ SQL QUERY: ${formatSqlQuery(meta.sqlQuery)}`;
    }

    if (
      meta.sqlParams &&
      config.logSqlParams &&
      Array.isArray(meta.sqlParams) &&
      meta.sqlParams.length > 0
    ) {
      logMessage += `\n    ├─ SQL PARAMS:\n        ${formatSqlParams(
        meta.sqlParams
      )}`;
    }

    if (meta.business) {
      logMessage += `\n    ├─ BUSINESS: ${meta.business.operation} on ${
        meta.business.entity || "N/A"
      } -> ${meta.business.status}`;
      if (meta.business.entityId)
        logMessage += ` [ID: ${meta.business.entityId}]`;
    }

    if (meta.validation) {
      logMessage += `\n    ├─ VALIDATION: Field '${meta.validation.field}' - ${meta.validation.error}`;
    }

    if (meta.auth) {
      logMessage += `\n    ├─ AUTH: ${meta.auth.action} - ${
        meta.auth.success ? "SUCCESS" : "FAILED"
      }`;
      if (meta.auth.user) {
        logMessage += ` [User: ${meta.auth.user.email || meta.auth.user.id}]`;
      }
    }

    if (meta.performance) {
      logMessage += `\n    ├─ PERFORMANCE: ${meta.performance.operation} took ${meta.performance.duration}`;
    }

    if (meta.error || stack) {
      const errorInfo = meta.error || { message: message, stack: stack };
      logMessage += `\n    ├─ ERROR DETAILS:`;
      logMessage += `\n    │  ├─ Name: ${errorInfo.name || "Unknown"}`;
      logMessage += `\n    │  ├─ Message: ${errorInfo.message || message}`;
      logMessage += `\n    │  ├─ Code: ${errorInfo.code || "N/A"}`;
      if (errorInfo.stack && config.logStackTrace) {
        logMessage += `\n    │  └─ Stack Trace:\n${errorInfo.stack
          .split("\n")
          .map((line) => `    │     ${line}`)
          .join("\n")}`;
      }
    }

    return logMessage;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logEntry = `\n${"=".repeat(100)}\n`;
    logEntry += `TIMESTAMP: ${timestamp}\n`;
    logEntry += `LEVEL: ${level.toUpperCase()}\n`;
    logEntry += `PID: ${process.pid}\n`;
    logEntry += `REQUEST_ID: ${meta.requestId || "N/A"}\n`;
    logEntry += `CLASS.METHOD: ${meta.className || "Unknown"}.${
      meta.methodName || "unknown"
    }\n`;
    logEntry += `MESSAGE: ${message}\n`;

    if (meta.method && meta.endpoint) {
      logEntry += `\nHTTP DETAILS:\n`;
      logEntry += `  Method: ${meta.method}\n`;
      logEntry += `  Endpoint: ${meta.endpoint}\n`;
      logEntry += `  Status Code: ${meta.statusCode || "PROCESSING"}\n`;
      if (meta.duration) logEntry += `  Duration: ${meta.duration}ms\n`;
      if (meta.clientIp) logEntry += `  Client IP: ${meta.clientIp}\n`;
      if (meta.userAgent) logEntry += `  User Agent: ${meta.userAgent}\n`;
    }

    if (meta.request) {
      logEntry += `\nREQUEST CONTEXT:\n`;
      if (meta.request.body && config.logRequestBody) {
        logEntry += `  Body: ${JSON.stringify(
          safeStringify(meta.request.body),
          null,
          4
        )}\n`;
      }
      if (meta.request.params && Object.keys(meta.request.params).length > 0) {
        logEntry += `  Params: ${JSON.stringify(
          meta.request.params,
          null,
          4
        )}\n`;
      }
      if (meta.request.query && Object.keys(meta.request.query).length > 0) {
        logEntry += `  Query: ${JSON.stringify(meta.request.query, null, 4)}\n`;
      }
      if (meta.request.headers && config.logHeaders) {
        logEntry += `  Headers: ${JSON.stringify(
          safeStringify(meta.request.headers),
          null,
          4
        )}\n`;
      }
    }

    if (meta.userId || meta.email) {
      logEntry += `\nUSER CONTEXT:\n`;
      logEntry += `  User ID: ${meta.userId || "N/A"}\n`;
      logEntry += `  Email: ${meta.email || "N/A"}\n`;
      logEntry += `  Session ID: ${meta.sessionId || "N/A"}\n`;
    }

    if (meta.business) {
      logEntry += `\nBUSINESS OPERATION:\n`;
      logEntry += `  Operation: ${meta.business.operation}\n`;
      logEntry += `  Entity: ${meta.business.entity || "N/A"}\n`;
      logEntry += `  Entity ID: ${meta.business.entityId || "N/A"}\n`;
      logEntry += `  Status: ${meta.business.status}\n`;
      if (meta.business.details) {
        logEntry += `  Details: ${JSON.stringify(
          meta.business.details,
          null,
          4
        )}\n`;
      }
    }

    if (meta.database) {
      logEntry += `\nDATABASE OPERATION:\n`;
      logEntry += `  Operation: ${meta.database.operation}\n`;
      logEntry += `  Table: ${meta.database.table}\n`;
      if (meta.database.duration)
        logEntry += `  Duration: ${meta.database.duration}ms\n`;
      if (meta.database.affectedRecords) {
        logEntry += `  Affected Records: ${meta.database.affectedRecords}\n`;
      }
    }

    if (meta.sqlQuery && config.logQueries) {
      logEntry += `\nSQL QUERY:\n${formatSqlQuery(meta.sqlQuery)}\n`;
    }

    if (
      meta.sqlParams &&
      config.logSqlParams &&
      Array.isArray(meta.sqlParams) &&
      meta.sqlParams.length > 0
    ) {
      logEntry += `\nSQL PARAMETERS:\n  ${formatSqlParams(meta.sqlParams)}\n`;
    }

    if (meta.whereConditions) {
      logEntry += `\nWHERE CONDITIONS:\n  ${meta.whereConditions}\n`;
    }

    if (meta.auth) {
      logEntry += `\nAUTHENTICATION:\n`;
      logEntry += `  Action: ${meta.auth.action}\n`;
      logEntry += `  Success: ${meta.auth.success}\n`;
      if (meta.auth.user) {
        logEntry += `  User: ${JSON.stringify(
          safeStringify(meta.auth.user),
          null,
          4
        )}\n`;
      }
      if (meta.auth.reason) {
        logEntry += `  Failure Reason: ${meta.auth.reason}\n`;
      }
    }

    if (meta.validation) {
      logEntry += `\nVALIDATION:\n`;
      logEntry += `  Field: ${meta.validation.field}\n`;
      logEntry += `  Error: ${meta.validation.error}\n`;
      logEntry += `  Value Present: ${meta.validation.value}\n`;
      logEntry += `  Required: ${meta.validation.required}\n`;
      if (meta.validation.actualValue) {
        logEntry += `  Actual Value: ${meta.validation.actualValue}\n`;
      }
    }

    if (meta.performance) {
      logEntry += `\nPERFORMANCE:\n`;
      logEntry += `  Operation: ${meta.performance.operation}\n`;
      logEntry += `  Duration: ${meta.performance.duration}\n`;
      if (meta.performance.memoryUsage) {
        logEntry += `  Memory Usage: ${JSON.stringify(
          meta.performance.memoryUsage,
          null,
          4
        )}\n`;
      }
    }

    if (meta.security) {
      logEntry += `\nSECURITY EVENT:\n`;
      logEntry += `  Event: ${meta.security.event}\n`;
      logEntry += `  Severity: ${meta.security.severity}\n`;
      logEntry += `  Details: ${JSON.stringify(
        safeStringify(meta.security.details),
        null,
        4
      )}\n`;
    }

    if (meta.error || stack) {
      const errorInfo = meta.error || { message: message, stack: stack };
      logEntry += `\nERROR DETAILS:\n`;
      logEntry += `  Error Name: ${errorInfo.name || "Unknown"}\n`;
      logEntry += `  Error Message: ${errorInfo.message || message}\n`;
      logEntry += `  Error Code: ${errorInfo.code || "N/A"}\n`;

      if (errorInfo.stack && config.logStackTrace) {
        logEntry += `  Stack Trace:\n${errorInfo.stack}\n`;
      }

      if (errorInfo.sql) logEntry += `  SQL Query: ${errorInfo.sql}\n`;
      if (errorInfo.parameters)
        logEntry += `  SQL Parameters: ${JSON.stringify(
          errorInfo.parameters
        )}\n`;
      if (errorInfo.constraint)
        logEntry += `  DB Constraint: ${errorInfo.constraint}\n`;
      if (errorInfo.detail) logEntry += `  Error Detail: ${errorInfo.detail}\n`;
    }

    logEntry += `\nSYSTEM CONTEXT:\n`;
    logEntry += `  Environment: ${process.env.NODE_ENV || "development"}\n`;
    logEntry += `  Hostname: ${os.hostname()}\n`;
    logEntry += `  Platform: ${os.platform()}\n`;
    logEntry += `  Node Version: ${process.version}\n`;

    if (meta.system?.memoryUsage) {
      logEntry += `  Memory Usage: ${JSON.stringify(
        meta.system.memoryUsage,
        null,
        4
      )}\n`;
    }

    logEntry += `${"=".repeat(100)}\n`;
    return logEntry;
  })
);

class DatabaseTransport extends winston.Transport {
  constructor(options = {}) {
    super(options);
    this.name = "database";
    this.level = options.level || "info";
  }

  async log(info, callback) {
    setImmediate(() => this.emit("logged", info));

    try {
      if (config.database && prisma) {
        await this.logToDatabase(info);
      }
    } catch (error) {
      console.error("Failed to log to database:", error);
    }

    callback();
  }

  async logToDatabase(info) {
    try {
      await prisma.log.create({
        data: {
          level: info.level,
          message: info.message,
          timestamp: new Date(info.timestamp),
          metadata: {
            ...info,
            systemContext: {
              hostname: os.hostname(),
              pid: process.pid,
              memoryUsage: process.memoryUsage(),
              uptime: process.uptime(),
              nodeVersion: process.version,
              platform: os.platform(),
              arch: os.arch(),
            },
          },
          hostname: os.hostname(),
          pid: process.pid,
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: os.platform(),
          arch: os.arch(),
          stackTrace: info.stack || null,
          requestId: info.requestId || null,
          userId: info.userId || null,
          sessionId: info.sessionId || null,
          category: this.getLogCategory(info.level),
          severity: this.getLogSeverity(info.level),
        },
      });
    } catch (error) {
      console.error("Database logging error:", error);
    }
  }

  getLogCategory(level) {
    const categoryMap = {
      auth: "AUTHENTICATION",
      db: "DATABASE",
      query: "DATABASE",
      transaction: "DATABASE",
      payment: "PAYMENT",
      enrollment: "ENROLLMENT",
      course: "COURSE_MANAGEMENT",
      user: "USER_MANAGEMENT",
      http: "API",
      validation: "VALIDATION",
      business: "BUSINESS_LOGIC",
      security: "SECURITY",
      audit: "AUDIT",
      error: "ERROR",
      fatal: "ERROR",
    };
    return categoryMap[level] || "GENERAL";
  }

  getLogSeverity(level) {
    const severityMap = {
      fatal: "FATAL",
      error: "ERROR",
      warn: "WARN",
      info: "INFO",
      debug: "DEBUG",
      trace: "TRACE",
      query: "INFO",
      transaction: "INFO",
      validation: "WARN",
      business: "INFO",
      security: "ERROR",
      audit: "INFO",
    };
    return severityMap[level] || "INFO";
  }
}

const transports = [];

if (config.console) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.level,
    })
  );
}

if (config.file) {
  const maxSizeBytes = config.maxFileSize === "10MB" ? 10485760 : 5242880;

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "application.log"),
      level: "trace",
      format: fileFormat,
      maxsize: maxSizeBytes,
      maxFiles: config.maxFiles,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: maxSizeBytes,
      maxFiles: config.maxFiles,
    })
  );
}

if (config.database) {
  transports.push(new DatabaseTransport({ level: "info" }));
}

const logger = winston.createLogger({
  levels: customLevels.levels,
  level: config.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true })
  ),
  transports,
  exitOnError: false,
});

// ADD THIS DEBUG CODE RIGHT HERE:
console.log("🔧 Winston Logger Levels:", logger.levels);
console.log("🔧 Current Log Level:", logger.level);
console.log("🔧 Query Level Value:", customLevels.levels.query);

logger.log("query", "WINSTON QUERY TEST", { test: "data" });
logger.log("info", "WINSTON INFO TEST", { test: "data" });

class EducademyLogger {
  constructor() {
    this.logger = logger;
    this.requestId = null;
    this.userId = null;
    this.sessionId = null;
    this.className = null;
    this.methodName = null;
    this.performanceEnabled = config.performance;
  }

  setContext({ requestId, userId, sessionId, className, methodName } = {}) {
    this.requestId = requestId;
    this.userId = userId;
    this.sessionId = sessionId;
    this.className = className;
    this.methodName = methodName;
  }

  getBaseMetadata(additionalMeta = {}) {
    return {
      requestId: this.requestId,
      userId: this.userId,
      sessionId: this.sessionId,
      className: this.className,
      methodName: this.methodName,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      system: {
        hostname: os.hostname(),
        pid: process.pid,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      },
      ...additionalMeta,
    };
  }

  logMethodEntry(className, methodName, params = {}) {
    this.setContext({ className, methodName });
    this.log("trace", `ENTERING ${className}.${methodName}()`, {
      business: {
        operation: "METHOD_ENTRY",
        entity: className,
        status: "STARTED",
      },
      request: { params: safeStringify(params) },
    });
  }

  logMethodExit(className, methodName, result = null, duration = null) {
    this.log("trace", `EXITING ${className}.${methodName}()`, {
      business: {
        operation: "METHOD_EXIT",
        entity: className,
        status: "COMPLETED",
        result: result ? "SUCCESS" : "FAILURE",
      },
      performance: duration
        ? { operation: `${className}.${methodName}`, duration: `${duration}ms` }
        : null,
    });
  }

  logBusinessOperation(operation, entity, entityId, status, details = {}) {
    this.log("business", `BUSINESS OPERATION: ${operation} on ${entity}`, {
      business: {
        operation,
        entity,
        entityId,
        status,
        details: safeStringify(details),
      },
    });
  }

  logValidationError(field, value, error, context = {}) {
    this.log("validation", `VALIDATION FAILED: ${field} - ${error}`, {
      validation: {
        field,
        value: !!value,
        error,
        required: true,
        actualValue: config.logRequestBody ? safeStringify(value) : "[HIDDEN]",
      },
      ...context,
    });
  }

  logDatabaseQuery(
    operation,
    table,
    query,
    params = null,
    duration = null,
    additionalContext = {}
  ) {
    this.log("query", `DATABASE ${operation}: ${table}`, {
      database: {
        operation: operation.toUpperCase(),
        table,
        duration: duration ? `${duration}ms` : null,
        affectedRecords: additionalContext.affectedRecords || "unknown",
        queryTarget: additionalContext.queryTarget || "unknown",
      },
      sqlQuery: query,
      sqlParams: params,
      whereConditions: additionalContext.whereConditions || null,
      performance: duration
        ? {
            operation: `DB_${operation}`,
            duration: `${duration}ms`,
            table,
          }
        : null,
    });
  }

  logTransaction(transactionId, operation, status, details = {}) {
    this.log("transaction", `TRANSACTION ${operation}: ${transactionId}`, {
      database: {
        operation: "TRANSACTION",
        table: "multiple",
        transactionId,
      },
      business: {
        operation,
        status,
        details: safeStringify(details),
      },
    });
  }

  logSecurityEvent(event, severity, details, userId = null) {
    this.log("security", `SECURITY EVENT: ${event}`, {
      security: {
        event,
        severity: severity.toUpperCase(),
        details: safeStringify(details),
        userId: userId || this.userId,
      },
    });
  }

  logAuditTrail(action, entity, entityId, oldValue, newValue, userId = null) {
    this.log("audit", `AUDIT: ${action} on ${entity}:${entityId}`, {
      audit: {
        action,
        entity,
        entityId,
        oldValue: safeStringify(oldValue),
        newValue: safeStringify(newValue),
        userId: userId || this.userId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  log(level, message, meta = {}) {
    this.logger.log(level, message, this.getBaseMetadata(meta));
  }

  fatal(message, error = null, meta = {}) {
    const errorMeta = error ? { error: safeStringify(error) } : {};

    this.log("fatal", message, {
      ...meta,
      ...errorMeta,
      business: {
        operation: "SYSTEM_FAILURE",
        status: "FATAL_ERROR",
      },
    });
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? { error: safeStringify(error) } : {};

    this.log("error", message, {
      ...meta,
      ...errorMeta,
      business: {
        operation: meta.business?.operation || "ERROR_HANDLING",
        status: "ERROR",
      },
    });
  }

  warn(message, meta = {}) {
    this.log("warn", message, { ...meta });
  }

  info(message, meta = {}) {
    this.log("info", message, { ...meta });
  }

  debug(message, meta = {}) {
    this.log("debug", message, { ...meta });
  }

  trace(message, meta = {}) {
    this.log("trace", message, { ...meta });
  }

  http(method, url, statusCode, responseTime, meta = {}) {
    let level, message, statusExplanation;

    const getStatusExplanation = (code) => {
      if (code === "INCOMING") return "Request received by server";
      if (code >= 200 && code < 300)
        return "Success - Request completed successfully";
      if (code >= 300 && code < 400)
        return "Redirect - Resource has moved to different location";
      if (code >= 400 && code < 500)
        return "Client Error - Problem with the request from client";
      if (code >= 500) return "Server Error - Problem occurred on the server";
      return "Unknown status code";
    };

    statusExplanation = getStatusExplanation(statusCode);

    if (statusCode === "INCOMING") {
      level = "http";
      message = `HTTP REQUEST: ${method} ${url}`;
    } else if (statusCode >= 500) {
      level = "error";
      message = `HTTP SERVER ERROR: ${method} ${url} [${statusCode}]`;
    } else if (statusCode >= 400) {
      level = "warn";
      message = `HTTP CLIENT ERROR: ${method} ${url} [${statusCode}]`;
    } else {
      level = "http";
      message = `HTTP SUCCESS: ${method} ${url} [${statusCode}]`;
    }

    this.log(level, message, {
      ...meta,
      method,
      endpoint: url,
      statusCode,
      duration: responseTime,
      http: {
        method,
        url,
        statusCode,
        responseTime: responseTime ? `${responseTime}ms` : "N/A",
        statusExplanation,
      },
    });
  }

  auth(action, success, user = null, meta = {}) {
    const level = success ? "auth" : "warn";
    const message = `AUTHENTICATION ${action}: ${
      success ? "SUCCESS" : "FAILED"
    }`;

    this.log(level, message, {
      ...meta,
      auth: {
        action,
        success,
        user: user ? { id: user.id, email: user.email, role: user.role } : null,
        reason:
          meta.reason ||
          (success ? "Valid credentials" : "Authentication failed"),
      },
      business: {
        operation: "AUTHENTICATION",
        entity: "USER",
        entityId: user?.id,
        status: success ? "SUCCESS" : "FAILED",
      },
    });
  }

  performance(operation, startTime, meta = {}) {
    if (!this.performanceEnabled) return;

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    const memUsage = process.memoryUsage();

    this.log("info", `PERFORMANCE: ${operation} completed in ${duration}ms`, {
      ...meta,
      performance: {
        operation,
        duration: `${duration}ms`,
        startTime,
        endTime,
        memoryUsage: memUsage,
      },
    });
  }

  success(message, meta = {}) {
    this.log("info", message, { ...meta });
  }

  start(component, meta = {}) {
    this.log("info", `STARTING: ${component}`, {
      ...meta,
      business: {
        operation: "SYSTEM_STARTUP",
        entity: component,
        status: "STARTING",
      },
    });
  }

  stop(component, meta = {}) {
    this.log("info", `STOPPING: ${component}`, {
      ...meta,
      business: {
        operation: "SYSTEM_SHUTDOWN",
        entity: component,
        status: "STOPPING",
      },
    });
  }

  getConfig() {
    return config;
  }
}

const educademyLogger = new EducademyLogger();

export const httpLoggerMiddleware = (req, res, next) => {
  if (!config.console && !config.file && !config.database) {
    return next();
  }

  const start = performance.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  let requestBody = null;
  if (req.body && Object.keys(req.body).length > 0) {
    requestBody = safeStringify(req.body);
  }

  const requestContext = {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    protocol: req.protocol,
    secure: req.secure,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    contentType: req.get("Content-Type"),
    contentLength: req.get("Content-Length"),
    authorization: req.get("Authorization") ? "[PRESENT]" : "[NOT_PRESENT]",
    cookies:
      Object.keys(req.cookies || {}).length > 0 ? "[PRESENT]" : "[NOT_PRESENT]",
    body: requestBody,
    params:
      req.params && Object.keys(req.params).length > 0 ? req.params : null,
    query: req.query && Object.keys(req.query).length > 0 ? req.query : null,
    headers: config.logHeaders
      ? safeStringify(req.headers)
      : "[HEADERS_HIDDEN]",
  };

  educademyLogger.setContext({
    requestId,
    userId: req.user?.id,
    sessionId: req.sessionID,
    className: "HttpMiddleware",
    methodName: "processRequest",
  });

  educademyLogger.http(req.method, req.originalUrl, "INCOMING", 0, {
    clientIp: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent"),
    request: requestContext,
  });

  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;

  let responseBody = null;
  let responseSent = false;

  res.send = function (body) {
    if (!responseSent && config.logResponseBody && body) {
      responseBody = safeStringify(body);
    }
    responseSent = true;
    return originalSend.call(this, body);
  };

  res.json = function (obj) {
    if (!responseSent && config.logResponseBody && obj) {
      responseBody = safeStringify(obj);
    }
    responseSent = true;
    return originalJson.call(this, obj);
  };

  res.end = function (...args) {
    if (!responseSent) {
      responseSent = true;
    }

    const responseTime = Math.round(performance.now() - start);

    const responseContext = {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      responseTime: `${responseTime}ms`,
      headers: {
        contentType: res.get("Content-Type"),
        contentLength: res.get("Content-Length"),
        location: res.get("Location"),
        setCookie: res.get("Set-Cookie") ? "[PRESENT]" : "[NOT_PRESENT]",
      },
      body: responseBody,
    };

    educademyLogger.http(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      {
        clientIp: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        request: requestContext,
        response: responseContext,
      }
    );

    originalEnd.apply(this, args);
  };

  next();
};

export const createPrismaLogger = () => {
  return {
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
  };
};

export const setupPrismaLogging = (prismaClient) => {
  prismaClient.$on("query", (e) => {
    const queryLower = (e.query || "").toLowerCase().trim();
    let tableName = "unknown";
    let operation = "QUERY";
    let affectedRecords = "unknown";

    if (queryLower.includes("select")) {
      operation = "SELECT";
      const fromMatch =
        queryLower.match(/from\s+"?(\w+)"?\.?"?(\w+)"?/i) ||
        queryLower.match(/from\s+"?(\w+)"?/i);
      if (fromMatch) {
        tableName = fromMatch[2] || fromMatch[1];
      }

      const joinMatches = queryLower.match(/join\s+"?(\w+)"?\.?"?(\w+)"?/gi);
      if (joinMatches) {
        const joinTables = joinMatches.map((match) => {
          const tableMatch =
            match.match(/join\s+"?(\w+)"?\.?"?(\w+)"?/i) ||
            match.match(/join\s+"?(\w+)"?/i);
          return tableMatch ? tableMatch[2] || tableMatch[1] : "unknown";
        });
        tableName += ` (JOINS: ${joinTables.join(", ")})`;
      }
    } else if (queryLower.includes("insert")) {
      operation = "INSERT";
      const intoMatch =
        queryLower.match(/insert\s+into\s+"?(\w+)"?\.?"?(\w+)"?/i) ||
        queryLower.match(/insert\s+into\s+"?(\w+)"?/i);
      if (intoMatch) {
        tableName = intoMatch[2] || intoMatch[1];
      }

      const valuesMatch = queryLower.match(/values\s*\(/gi);
      if (valuesMatch) {
        affectedRecords = valuesMatch.length;
      }
    } else if (queryLower.includes("update")) {
      operation = "UPDATE";
      const updateMatch =
        queryLower.match(/update\s+"?(\w+)"?\.?"?(\w+)"?/i) ||
        queryLower.match(/update\s+"?(\w+)"?/i);
      if (updateMatch) {
        tableName = updateMatch[2] || updateMatch[1];
      }
    } else if (queryLower.includes("delete")) {
      operation = "DELETE";
      const deleteMatch =
        queryLower.match(/delete\s+from\s+"?(\w+)"?\.?"?(\w+)"?/i) ||
        queryLower.match(/delete\s+from\s+"?(\w+)"?/i);
      if (deleteMatch) {
        tableName = deleteMatch[2] || deleteMatch[1];
      }
    } else if (queryLower.includes("create table")) {
      operation = "CREATE_TABLE";
      const createMatch =
        queryLower.match(/create\s+table\s+"?(\w+)"?\.?"?(\w+)"?/i) ||
        queryLower.match(/create\s+table\s+"?(\w+)"?/i);
      if (createMatch) {
        tableName = createMatch[2] || createMatch[1];
      }
    }

    let whereConditions = null;
    if (e.query) {
      const whereMatch = e.query.match(
        /WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|\s+OFFSET|$)/i
      );
      if (whereMatch) {
        whereConditions = whereMatch[1].trim();
      }
    }

    educademyLogger.logDatabaseQuery(
      operation,
      tableName,
      e.query,
      e.params,
      e.duration,
      {
        affectedRecords,
        whereConditions,
        queryTarget: e.target || "unknown",
      }
    );
  });

  prismaClient.$on("error", (e) => {
    let errorContext = {
      message: e.message,
      target: e.target,
    };

    if (e.message) {
      if (e.message.includes("duplicate key")) {
        errorContext.errorType = "DUPLICATE_KEY_VIOLATION";
        const constraintMatch = e.message.match(/constraint "([^"]+)"/);
        if (constraintMatch) {
          errorContext.constraint = constraintMatch[1];
        }
      } else if (e.message.includes("foreign key constraint")) {
        errorContext.errorType = "FOREIGN_KEY_VIOLATION";
        const constraintMatch = e.message.match(/constraint "([^"]+)"/);
        if (constraintMatch) {
          errorContext.constraint = constraintMatch[1];
        }
      } else if (e.message.includes("connection")) {
        errorContext.errorType = "CONNECTION_ERROR";
      } else if (e.message.includes("syntax error")) {
        errorContext.errorType = "SYNTAX_ERROR";
      }
    }

    educademyLogger.error("PRISMA DATABASE ERROR", e, {
      business: {
        operation: "DATABASE_ERROR",
        entity: "PRISMA",
        status: "ERROR",
      },
      database: {
        operation: "ERROR",
        table: errorContext.target || "unknown",
        errorType: errorContext.errorType || "UNKNOWN",
        constraint: errorContext.constraint,
      },
      error: {
        name: "PrismaError",
        message: e.message,
        target: e.target,
        code: e.code,
      },
    });
  });

  prismaClient.$on("info", (e) => {
    educademyLogger.info("PRISMA INFO", {
      message: e.message,
      target: e.target,
      business: {
        operation: "DATABASE_INFO",
        entity: "PRISMA",
        status: "INFO",
      },
    });
  });

  prismaClient.$on("warn", (e) => {
    educademyLogger.warn("PRISMA WARNING", {
      message: e.message,
      target: e.target,
      business: {
        operation: "DATABASE_WARNING",
        entity: "PRISMA",
        status: "WARNING",
      },
    });
  });
};

export const cleanOldLogs = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    if (process.env.NODE_ENV === "production" && prisma) {
      const deleted = await prisma.log.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      educademyLogger.logBusinessOperation(
        "CLEANUP_LOGS",
        "LOG",
        null,
        "SUCCESS",
        { deletedCount: deleted.count, daysToKeep }
      );
    }
  } catch (error) {
    educademyLogger.error("Failed to clean old logs", error, {
      business: {
        operation: "CLEANUP_LOGS",
        entity: "LOG",
        status: "ERROR",
      },
    });
  }
};

export const getLogs = async (options = {}) => {
  if (!prisma) return [];

  const {
    level,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
    userId,
    search,
  } = options;

  try {
    const where = {};

    if (level) where.level = level;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.message = {
        contains: search,
        mode: "insensitive",
      };
    }

    const logs = await prisma.log.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    educademyLogger.logBusinessOperation(
      "RETRIEVE_LOGS",
      "LOG",
      null,
      "SUCCESS",
      { count: logs.length, filters: options }
    );

    return logs;
  } catch (error) {
    educademyLogger.error("Failed to retrieve logs", error, {
      business: {
        operation: "RETRIEVE_LOGS",
        entity: "LOG",
        status: "ERROR",
      },
    });
    return [];
  }
};

export const exportLogs = async (options = {}) => {
  try {
    const logs = await getLogs({ ...options, limit: 10000 });

    const exportData = {
      exportDate: new Date().toISOString(),
      totalLogs: logs.length,
      logs,
    };

    educademyLogger.logBusinessOperation(
      "EXPORT_LOGS",
      "LOG",
      null,
      "SUCCESS",
      { exportedCount: logs.length }
    );

    return exportData;
  } catch (error) {
    educademyLogger.error("Failed to export logs", error, {
      business: {
        operation: "EXPORT_LOGS",
        entity: "LOG",
        status: "ERROR",
      },
    });
    return null;
  }
};

process.on("uncaughtException", (error) => {
  educademyLogger.fatal("UNCAUGHT EXCEPTION", error, {
    business: {
      operation: "UNCAUGHT_EXCEPTION",
      entity: "PROCESS",
      status: "FATAL",
    },
    system: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    },
  });
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  educademyLogger.fatal("UNHANDLED REJECTION", reason, {
    business: {
      operation: "UNHANDLED_REJECTION",
      entity: "PROCESS",
      status: "FATAL",
    },
    promise: promise?.toString() || "Unknown promise",
    system: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    },
  });
  process.exit(1);
});

if (prisma) {
  setupPrismaLogging(prisma);
}

export default educademyLogger;
export { LOG_ICONS, customLevels, EducademyLogger, safeStringify };
