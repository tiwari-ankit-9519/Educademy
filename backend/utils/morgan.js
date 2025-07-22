import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { AsyncLocalStorage } from "async_hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create async local storage for request context
const requestContext = new AsyncLocalStorage();

// Enhanced custom tokens
morgan.token("id", (req) => req.headers["x-request-id"] || "no-id");
morgan.token("user-id", (req) => req.userAuthId || "anonymous");
morgan.token("real-ip", (req) => {
  return (
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
});

morgan.token("user-agent-short", (req) => {
  const ua = req.headers["user-agent"];
  if (!ua) return "unknown";
  const match = ua.match(
    /(Chrome|Firefox|Safari|Edge|Opera|Postman|Thunder|curl)\/?\d*/i
  );
  return match ? match[0] : ua.substring(0, 30);
});

morgan.token("request-body", (req) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const body = { ...req.body };
    if (body.password) body.password = "[REDACTED]";
    if (body.passwordHash) body.passwordHash = "[REDACTED]";
    if (body.salt) body.salt = "[REDACTED]";
    return JSON.stringify(body);
  }
  return "";
});

morgan.token("response-body", (req, res) => {
  if (res.responseBody) {
    const body = JSON.parse(res.responseBody);
    if (body.data && body.data.passwordHash)
      body.data.passwordHash = "[REDACTED]";
    if (body.data && body.data.salt) body.data.salt = "[REDACTED]";
    return JSON.stringify(body);
  }
  return "";
});

morgan.token("sql-queries", (req) => {
  return req.sqlQueries ? JSON.stringify(req.sqlQueries) : "";
});

morgan.token("error-details", (req, res) => {
  return res.errorDetails ? JSON.stringify(res.errorDetails) : "";
});

morgan.token("controller-method", (req) => {
  return req.controllerMethod || "unknown";
});

morgan.token("execution-time", (req) => {
  return req.executionTime || "0";
});

// Enhanced request/response capture middleware
export const debugMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  req.startTime = startTime;
  req.sqlQueries = [];

  // Capture request body
  const originalSend = res.send;
  const originalJson = res.json;

  // Capture response body
  res.json = function (obj) {
    res.responseBody = JSON.stringify(obj);
    return originalJson.call(this, obj);
  };

  res.send = function (body) {
    res.responseBody = body;
    return originalSend.call(this, body);
  };

  // Capture execution time
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    req.executionTime = Number(endTime - startTime) / 1000000;
  });

  next();
};

// Request context middleware using AsyncLocalStorage
export const requestContextMiddleware = (req, res, next) => {
  // Run the rest of the request in the async context
  requestContext.run({ req, queries: [] }, () => {
    req.sqlQueries = [];

    const store = requestContext.getStore();
    if (store) {
      store.queries = req.sqlQueries;
    }

    next();
  });
};

export const setupPrismaQueryCapture = (prismaClient) => {
  if (!prismaClient) {
    return;
  }

  prismaClient.$use(async (params, next) => {
    const startTime = Date.now();

    const queryInfo = {
      model: params.model,
      action: params.action,
      args: JSON.parse(JSON.stringify(params.args)),
      timestamp: new Date().toISOString(),
      startTime: startTime,
    };

    try {
      const result = await next(params);
      const duration = Date.now() - startTime;

      queryInfo.duration = duration;
      queryInfo.success = true;

      const store = requestContext.getStore();
      if (store && store.queries) {
        store.queries.push(queryInfo);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      queryInfo.duration = duration;
      queryInfo.success = false;
      queryInfo.error = error.message;

      const store = requestContext.getStore();
      if (store && store.queries) {
        store.queries.push(queryInfo);
      }

      throw error;
    }
  });

  // Also capture raw queries
  prismaClient.$on("query", (e) => {
    const queryInfo = {
      type: "raw_query",
      query: e.query,
      params: e.params,
      duration: e.duration,
      timestamp: e.timestamp,
      target: e.target,
    };

    const store = requestContext.getStore();
    if (store && store.queries) {
      store.queries.push(queryInfo);
    }
  });
};

export const createInstrumentedPrismaClient = (PrismaClient) => {
  return class InstrumentedPrismaClient extends PrismaClient {
    constructor(options = {}) {
      super(options);

      const originalQuery = this.$queryRaw;
      const originalQueryUnsafe = this.$queryRawUnsafe;

      this.$queryRaw = async (query, ...params) => {
        return this._captureQuery(
          "queryRaw",
          { query: query.toString(), params },
          () => originalQuery.call(this, query, ...params)
        );
      };

      this.$queryRawUnsafe = async (query, ...params) => {
        return this._captureQuery("queryRawUnsafe", { query, params }, () =>
          originalQueryUnsafe.call(this, query, ...params)
        );
      };

      // Set up the middleware for ORM queries
      this.$use(async (params, next) => {
        const startTime = Date.now();

        const queryInfo = {
          model: params.model,
          action: params.action,
          args: this._sanitizeArgs(params.args),
          timestamp: new Date().toISOString(),
          startTime: startTime,
        };

        try {
          const result = await next(params);
          const duration = Date.now() - startTime;

          queryInfo.duration = duration;
          queryInfo.success = true;

          this._addQueryToCurrentRequest(queryInfo);

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          queryInfo.duration = duration;
          queryInfo.success = false;
          queryInfo.error = error.message;

          this._addQueryToCurrentRequest(queryInfo);

          throw error;
        }
      });
    }

    _sanitizeArgs(args) {
      try {
        return JSON.parse(JSON.stringify(args));
      } catch (e) {
        return "[Complex Object]";
      }
    }

    _addQueryToCurrentRequest(queryInfo) {
      // Try AsyncLocalStorage first
      const store = requestContext.getStore();
      if (store && store.queries) {
        store.queries.push(queryInfo);
        return;
      }

      // Fallback: try to find current request from global
      if (global.currentRequest && global.currentRequest.sqlQueries) {
        global.currentRequest.sqlQueries.push(queryInfo);
      }
    }

    async _captureQuery(type, queryData, queryFn) {
      const startTime = Date.now();

      try {
        const result = await queryFn();
        const duration = Date.now() - startTime;

        const queryInfo = {
          type,
          ...queryData,
          duration,
          success: true,
          timestamp: new Date().toISOString(),
        };

        this._addQueryToCurrentRequest(queryInfo);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        const queryInfo = {
          type,
          ...queryData,
          duration,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        };

        this._addQueryToCurrentRequest(queryInfo);

        throw error;
      }
    }
  };
};

// Controller method tracking middleware
export const controllerTrackingMiddleware = (controllerName, methodName) => {
  return (req, res, next) => {
    req.controllerMethod = `${controllerName}.${methodName}`;
    next();
  };
};

// Error capture middleware
export const errorCaptureMiddleware = (err, req, res, next) => {
  res.errorDetails = {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode || 500,
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"],
  };
  next(err);
};

// Debug format for comprehensive logging
const debugFormat = (tokens, req, res) => {
  const status = tokens.status(req, res);
  const isError = parseInt(status) >= 400;

  const logData = {
    timestamp: new Date().toISOString(),
    requestId: tokens.id(req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(status),
    responseTime: parseFloat(tokens["response-time"](req, res)),
    executionTime: tokens["execution-time"](req, res),
    ip: tokens["real-ip"](req, res),
    userAgent: tokens["user-agent-short"](req, res),
    userId: tokens["user-id"](req, res),
    controller: tokens["controller-method"](req, res),
    requestBody: tokens["request-body"](req, res),
    responseBody: isError ? "" : tokens["response-body"](req, res),
    sqlQueries: tokens["sql-queries"](req, res),
    errorDetails: isError ? tokens["error-details"](req, res) : "",
    headers: JSON.stringify(req.headers),
    query: JSON.stringify(req.query),
    params: JSON.stringify(req.params),
  };

  return JSON.stringify(logData, null, 2);
};

// Console format with colors for development
const coloredConsoleFormat = (tokens, req, res) => {
  const status = parseInt(tokens.status(req, res));
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const responseTime = tokens["response-time"](req, res);
  const controller = tokens["controller-method"](req, res);
  const requestId = tokens.id(req, res);

  let statusColor = chalk.green;
  if (status >= 400) statusColor = chalk.red;
  else if (status >= 300) statusColor = chalk.yellow;

  let methodColor = chalk.blue;
  if (method === "POST") methodColor = chalk.green;
  else if (method === "PUT" || method === "PATCH") methodColor = chalk.yellow;
  else if (method === "DELETE") methodColor = chalk.red;

  const line1 = [
    chalk.gray(`[${new Date().toISOString()}]`),
    methodColor.bold(method),
    chalk.cyan(url),
    statusColor.bold(status),
    chalk.magenta(`${responseTime}ms`),
    chalk.gray(`ID: ${requestId}`),
  ].join(" ");

  const line2 = [
    chalk.gray("  →"),
    chalk.blue(`Controller: ${controller}`),
    chalk.gray(`User: ${tokens["user-id"](req, res)}`),
    chalk.gray(`IP: ${tokens["real-ip"](req, res)}`),
  ].join(" ");

  let result = line1 + "\n" + line2;

  // Add request body for POST/PUT/PATCH
  const requestBody = tokens["request-body"](req, res);
  if (requestBody && requestBody !== '""' && requestBody !== "") {
    result += "\n" + chalk.gray("  ↗ Request: ") + chalk.white(requestBody);
  }

  // Add SQL queries if any
  const sqlQueries = tokens["sql-queries"](req, res);
  if (sqlQueries && sqlQueries !== "[]" && sqlQueries !== "") {
    const queries = JSON.parse(sqlQueries);
    if (queries.length > 0) {
      result +=
        "\n" +
        chalk.gray("  🗄 SQL Queries: ") +
        chalk.cyan(`${queries.length} queries`);
      queries.forEach((query, index) => {
        if (query.model && query.action) {
          result +=
            "\n" +
            chalk.gray(`    ${index + 1}. `) +
            chalk.yellow(`${query.model}.${query.action}`) +
            chalk.gray(` (${query.duration}ms)`);
        } else if (query.query) {
          const shortQuery =
            query.query.length > 50
              ? query.query.substring(0, 50) + "..."
              : query.query;
          result +=
            "\n" +
            chalk.gray(`    ${index + 1}. `) +
            chalk.yellow(shortQuery) +
            chalk.gray(` (${query.duration}ms)`);
        }
      });
    }
  }

  // Add response body for successful requests
  if (status < 400) {
    const responseBody = tokens["response-body"](req, res);
    if (responseBody && responseBody !== '""' && responseBody !== "") {
      const truncatedResponse =
        responseBody.length > 200
          ? responseBody.substring(0, 200) + "..."
          : responseBody;
      result +=
        "\n" + chalk.gray("  ↙ Response: ") + chalk.green(truncatedResponse);
    }
  }

  // Add error details for failed requests
  if (status >= 400) {
    const errorDetails = tokens["error-details"](req, res);
    if (errorDetails && errorDetails !== '""' && errorDetails !== "") {
      result += "\n" + chalk.gray("  ❌ Error: ") + chalk.red(errorDetails);
    }
  }

  return result + "\n" + chalk.gray("  " + "─".repeat(80));
};

// Configure Morgan with debug capabilities
export const configureMorgan = (app) => {
  const isDebugMode =
    process.env.DEBUG_MODE === "true" || process.env.NODE_ENV === "development";

  if (isDebugMode) {
    const debugLogStream = fs.createWriteStream(
      path.join(logsDir, "debug.log"),
      { flags: "a" }
    );

    app.use(
      morgan(debugFormat, {
        stream: debugLogStream,
        skip: () => false,
      })
    );

    app.use(
      morgan(coloredConsoleFormat, {
        skip: () => false,
      })
    );

    const errorLogStream = fs.createWriteStream(
      path.join(logsDir, "errors.log"),
      { flags: "a" }
    );

    app.use(
      morgan(debugFormat, {
        stream: errorLogStream,
        skip: (req, res) => res.statusCode < 400,
      })
    );
  } else {
    // Production logging (less verbose)
    const accessLogStream = fs.createWriteStream(
      path.join(logsDir, "access.log"),
      { flags: "a" }
    );

    app.use(
      morgan("combined", {
        stream: accessLogStream,
        skip: () => false,
      })
    );
  }
};

// Enhanced middleware setup
export const setupDebugMiddleware = (app) => {
  app.use(requestIdMiddleware);
  app.use(requestContextMiddleware);
  app.use(debugMiddleware);
  app.use(userIdMiddleware);
};

// Request ID middleware
export const requestIdMiddleware = (req, res, next) => {
  req.headers["x-request-id"] =
    req.headers["x-request-id"] || Math.random().toString(36).substr(2, 9);
  next();
};

// User ID middleware
export const userIdMiddleware = (req, res, next) => {
  if (req.user) {
    req.userAuthId = req.user.id;
  }
  next();
};

// Setup Prisma logging
export const setupPrismaLogging = (prisma) => {
  if (process.env.DEBUG_MODE === "true") {
    setupPrismaQueryCapture(prisma);
  }
};

// Global request tracking fallback
export const globalRequestMiddleware = (req, res, next) => {
  global.currentRequest = req;
  res.on("finish", () => {
    global.currentRequest = null;
  });
  next();
};

export default {
  configureMorgan,
  setupDebugMiddleware,
  errorCaptureMiddleware,
  setupPrismaLogging,
  setupPrismaQueryCapture,
  createInstrumentedPrismaClient,
};
