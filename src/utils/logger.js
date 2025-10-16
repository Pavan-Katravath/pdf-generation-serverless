const { formatDateTime } = require('./constants');

class Logger {
  constructor(enableLogs = false) {
    this.enableLogs = enableLogs || process.env.ENABLE_VERTIV_LOGS === 'true';
  }

  debug(message, data = '', userAgent = '') {
    if (this.enableLogs) {
      const timestamp = formatDateTime();
      console.log(`[${timestamp}] ${message}`, data, userAgent);
    }
  }

  info(message, data = '') {
    console.log(`[INFO] ${message}`, data);
  }

  warn(message, data = '') {
    console.warn(`[WARN] ${message}`, data);
  }

  error(message, error = '') {
    console.error(`[ERROR] ${message}`, error);
  }

  // Log API request start
  logRequestStart(endpoint, method, payload, userAgent = '') {
    this.debug(
      `${endpoint} Request Started at ${formatDateTime()}`,
      JSON.stringify({ Method: method, payload }),
      userAgent
    );
  }

  // Log API response
  logResponse(endpoint, response, userAgent = '') {
    this.debug(
      `${endpoint} Response at ${formatDateTime()}`,
      JSON.stringify(response),
      userAgent
    );
  }

  // Log PDF generation events
  logPDFGeneration(productGroup, callNo, status, details = '') {
    const message = `PDF Generation ${status} for ${productGroup} - Call: ${callNo}`;
    if (status === 'SUCCESS') {
      this.info(message, details);
    } else if (status === 'FAILED') {
      this.error(message, details);
    } else {
      this.debug(message, details);
    }
  }

  // Log S3 operations
  logS3Operation(operation, key, status, details = '') {
    const message = `S3 ${operation} ${status} for ${key}`;
    if (status === 'SUCCESS') {
      this.info(message, details);
    } else if (status === 'FAILED') {
      this.error(message, details);
    } else {
      this.debug(message, details);
    }
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;

