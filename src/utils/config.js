const { validateRequiredParams } = require('./constants');

class Config {
  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    // AWS Configuration
    this.aws = {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };

    // S3 Configuration
    this.s3 = {
      bucket: process.env.S3_BUCKET,
      endpoint: process.env.S3_ENDPOINT_URL || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    };

    // Application Configuration
    this.app = {
      stage: process.env.STAGE || 'dev',
      fsrReattemptTimeout: parseInt(process.env.FSR_REATTEMPT_TIMEOUT) || 5000,
      presignedUrlExpire: parseInt(process.env.PRESIGNED_URL_EXPIRE) || 3600,
      enableLogs: process.env.ENABLE_VERTIV_LOGS === 'true',
    };

    // Puppeteer Configuration
    this.puppeteer = {
      timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      useExecutionPath: process.env.USE_EXECUTION_PATH === 'true',
    };
  }

  validate() {
    const requiredConfig = {
      'AWS_REGION': this.aws.region,
      'AWS_ACCESS_KEY_ID': this.aws.accessKeyId,
      'AWS_SECRET_ACCESS_KEY': this.aws.secretAccessKey,
      'S3_BUCKET': this.s3.bucket,
    };

    const missing = Object.entries(requiredConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    return true;
  }

  isS3Configured() {
    return !!(this.s3.bucket && this.aws.accessKeyId && this.aws.secretAccessKey);
  }

  getS3Config() {
    return {
      region: this.aws.region,
      accessKeyId: this.aws.accessKeyId,
      secretAccessKey: this.aws.secretAccessKey,
      endpoint: this.s3.endpoint,
      s3ForcePathStyle: this.s3.forcePathStyle,
    };
  }

  getPuppeteerConfig() {
    const config = {
      headless: true,
      timeout: this.puppeteer.timeout,
      args: [
        '--fast-start',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-extensions',
        '--no-gpu',
        '--override-plugin-power-saver-for-testing=never',
        '--disable-extensions-http-throttling',
        '--headless',
        '--mute-audio',
        '--disable-web-security',
        '--disable-features=site-per-process',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
      ],
    };

    if (this.puppeteer.useExecutionPath && this.puppeteer.executablePath) {
      config.executablePath = this.puppeteer.executablePath;
    }

    return config;
  }

  getSummary() {
    return {
      stage: this.app.stage,
      s3Configured: this.isS3Configured(),
      logsEnabled: this.app.enableLogs,
      region: this.aws.region,
      bucket: this.s3.bucket,
    };
  }
}

// Create singleton instance
const config = new Config();

module.exports = config;

