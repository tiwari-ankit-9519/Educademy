import educademyLogger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  const stack = err?.stack;
  const statusCode = err?.statusCode ? err.statusCode : 500;
  const message = err?.message;

  educademyLogger.error("Express Error Handler Caught Error", err, {
    errorDetails: {
      statusCode,
      message,
      stack,
      name: err?.name,
      code: err?.code,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      baseUrl: req.baseUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      referer: req.get("Referer"),
      authorization: req.get("Authorization") ? "Present" : "Not Present",
    },
    requestData: {
      query: req.query,
      body: req.body,
      params: req.params,
      headers: req.headers,
    },
    user: {
      userId: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
    },
    timestamp: new Date().toISOString(),
    severity: statusCode >= 500 ? "HIGH" : "MEDIUM",
  });

  // Send response to client
  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      ...(process.env.NODE_ENV === "development" && { stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  });
};

export const notFound = (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;

  // Log the 404 error
  educademyLogger.warn("Route Not Found", {
    route: req.originalUrl,
    method: req.method,
    clientInfo: {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      referer: req.get("Referer"),
    },
    requestData: {
      query: req.query,
      body: req.body,
      params: req.params,
    },
    timestamp: new Date().toISOString(),
    severity: "LOW",
  });

  next(err);
};

// Additional middleware for async error handling
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    // Log async errors before passing to error handler
    educademyLogger.error("Async Route Error", error, {
      route: req.originalUrl,
      method: req.method,
      asyncError: true,
      clientInfo: {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      user: {
        userId: req.user?.id,
        email: req.user?.email,
      },
    });
    next(error);
  });
};

// Validation error handler
export const validationErrorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    const validationErrors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));

    educademyLogger.warn("Validation Error", {
      validationErrors,
      route: req.originalUrl,
      method: req.method,
      clientInfo: {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      requestData: {
        body: req.body,
        query: req.query,
      },
    });

    return res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        details: validationErrors,
      },
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
};

// Database error handler
export const databaseErrorHandler = (err, req, res, next) => {
  if (err.name === "PrismaClientKnownRequestError") {
    let message = "Database operation failed";
    let statusCode = 500;

    // Handle specific Prisma error codes
    switch (err.code) {
      case "P2002":
        message = "A record with this information already exists";
        statusCode = 409;
        break;
      case "P2025":
        message = "Record not found";
        statusCode = 404;
        break;
      case "P2003":
        message = "Foreign key constraint failed";
        statusCode = 400;
        break;
      default:
        message = "Database error occurred";
    }

    educademyLogger.error("Database Error", err, {
      prismaError: {
        code: err.code,
        meta: err.meta,
        clientVersion: err.clientVersion,
      },
      route: req.originalUrl,
      method: req.method,
      operation: "DATABASE_OPERATION",
      clientInfo: {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
    });

    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        code: err.code,
      },
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
};

// Authentication error handler
export const authErrorHandler = (err, req, res, next) => {
  if (err.name === "UnauthorizedError" || err.name === "JsonWebTokenError") {
    educademyLogger.security("Authentication Error", "MEDIUM", err.message, {
      route: req.originalUrl,
      method: req.method,
      tokenError: true,
      clientInfo: {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      authHeader: req.get("Authorization") ? "Present" : "Missing",
    });

    return res.status(401).json({
      success: false,
      error: {
        message: "Authentication failed",
        details: "Invalid or expired token",
      },
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
};

// Rate limiting error handler
export const rateLimitErrorHandler = (err, req, res, next) => {
  if (err.name === "TooManyRequestsError") {
    educademyLogger.security(
      "Rate Limit Exceeded",
      "HIGH",
      `Too many requests from ${req.ip}`,
      {
        route: req.originalUrl,
        method: req.method,
        clientInfo: {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        },
        rateLimitInfo: {
          limit: err.limit,
          current: err.current,
          remaining: err.remaining,
          resetTime: err.resetTime,
        },
      }
    );

    return res.status(429).json({
      success: false,
      error: {
        message: "Too many requests",
        details: "Rate limit exceeded. Please try again later.",
        retryAfter: err.retryAfter,
      },
      timestamp: new Date().toISOString(),
    });
  }
  next(err);
};
