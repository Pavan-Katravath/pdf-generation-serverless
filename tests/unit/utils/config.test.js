const config = require('../../../src/utils/config');

describe('Config Utility', () => {
  describe('Configuration Loading', () => {
    it('should initialize with test environment values', () => {
      expect(config.aws.region).toBe('us-east-1');
      expect(config.aws.accessKeyId).toBe('OdJTvIf88W6W4HNm5wn5');
      expect(config.aws.secretAccessKey).toBe('YLYwa9qw3Lnzrp9bmQF4IOXhztdHdMo2ZbqtE0W4');
      expect(config.s3.bucket).toBe('vertiv');
      expect(config.s3.endpoint).toBe('http://localhost:9000');
      expect(config.s3.forcePathStyle).toBe(true);
      expect(config.app.stage).toBe('test');
      expect(config.app.fsrReattemptTimeout).toBe(5000);
      expect(config.app.presignedUrlExpire).toBe(3600);
      expect(config.app.enableLogs).toBe(false);
      expect(config.puppeteer.timeout).toBe(30000);
      expect(config.puppeteer.executablePath).toBeUndefined();
      expect(config.puppeteer.useExecutionPath).toBe(false);
    });
  });

  describe('validate', () => {
    it('should pass validation with all required config', () => {
      expect(() => config.validate()).not.toThrow();
      expect(config.validate()).toBe(true);
    });
  });

  describe('isS3Configured', () => {
    it('should return true when all S3 config is present', () => {
      expect(config.isS3Configured()).toBe(true);
    });
  });

  describe('getS3Config', () => {
    it('should return S3 configuration object', () => {
      const s3Config = config.getS3Config();
      
      expect(s3Config).toEqual({
        region: 'us-east-1',
        accessKeyId: 'OdJTvIf88W6W4HNm5wn5',
        secretAccessKey: 'YLYwa9qw3Lnzrp9bmQF4IOXhztdHdMo2ZbqtE0W4',
        endpoint: 'http://localhost:9000',
        s3ForcePathStyle: true
      });
    });
  });

  describe('getPuppeteerConfig', () => {
    it('should return default puppeteer configuration', () => {
      const puppeteerConfig = config.getPuppeteerConfig();
      
      expect(puppeteerConfig).toEqual({
        headless: true,
        timeout: 30000,
        args: expect.arrayContaining([
          '--fast-start',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--headless',
          '--mute-audio',
          '--disable-web-security'
        ])
      });
    });
  });

  describe('getSummary', () => {
    it('should return configuration summary', () => {
      const summary = config.getSummary();
      
      expect(summary).toEqual({
        stage: 'test',
        s3Configured: true,
        logsEnabled: false,
        region: 'us-east-1',
        bucket: 'vertiv'
      });
    });
  });

  describe('Configuration Structure', () => {
    it('should have proper AWS configuration structure', () => {
      expect(config.aws).toBeDefined();
      expect(typeof config.aws.region).toBe('string');
      expect(typeof config.aws.accessKeyId).toBe('string');
      expect(typeof config.aws.secretAccessKey).toBe('string');
    });

    it('should have proper S3 configuration structure', () => {
      expect(config.s3).toBeDefined();
      expect(typeof config.s3.bucket).toBe('string');
      expect(typeof config.s3.forcePathStyle).toBe('boolean');
    });

    it('should have proper app configuration structure', () => {
      expect(config.app).toBeDefined();
      expect(typeof config.app.stage).toBe('string');
      expect(typeof config.app.fsrReattemptTimeout).toBe('number');
      expect(typeof config.app.presignedUrlExpire).toBe('number');
      expect(typeof config.app.enableLogs).toBe('boolean');
    });

    it('should have proper puppeteer configuration structure', () => {
      expect(config.puppeteer).toBeDefined();
      expect(typeof config.puppeteer.timeout).toBe('number');
      expect(typeof config.puppeteer.useExecutionPath).toBe('boolean');
      // args are only available in getPuppeteerConfig() method, not directly on config.puppeteer
      const puppeteerConfig = config.getPuppeteerConfig();
      expect(Array.isArray(puppeteerConfig.args)).toBe(true);
    });
  });

  describe('Method Functionality', () => {
    it('should validate configuration correctly', () => {
      const isValid = config.validate();
      expect(typeof isValid).toBe('boolean');
    });

    it('should check S3 configuration correctly', () => {
      const isConfigured = config.isS3Configured();
      expect(typeof isConfigured).toBe('boolean');
    });

    it('should return S3 config object', () => {
      const s3Config = config.getS3Config();
      expect(typeof s3Config).toBe('object');
      expect(s3Config.region).toBeDefined();
      expect(s3Config.accessKeyId).toBeDefined();
      expect(s3Config.secretAccessKey).toBeDefined();
    });

    it('should return puppeteer config object', () => {
      const puppeteerConfig = config.getPuppeteerConfig();
      expect(typeof puppeteerConfig).toBe('object');
      expect(typeof puppeteerConfig.timeout).toBe('number');
      expect(Array.isArray(puppeteerConfig.args)).toBe(true);
    });

    it('should return summary object', () => {
      const summary = config.getSummary();
      expect(typeof summary).toBe('object');
      expect(typeof summary.stage).toBe('string');
      expect(typeof summary.s3Configured).toBe('boolean');
      expect(typeof summary.logsEnabled).toBe('boolean');
      expect(typeof summary.region).toBe('string');
    });

    it('should handle missing configuration validation', () => {
      // Test the validation logic for missing config
      const originalConfig = { ...config };
      
      // Temporarily modify config to have missing values
      config.aws.accessKeyId = '';
      config.aws.secretAccessKey = '';
      
      expect(() => config.validate()).toThrow('Missing required configuration');
      
      // Restore original config
      Object.assign(config, originalConfig);
    });

    it('should handle puppeteer executable path configuration', () => {
      // Test the puppeteer config with executable path
      const originalConfig = { ...config.puppeteer };
      
      config.puppeteer.useExecutionPath = true;
      config.puppeteer.executablePath = '/path/to/chrome';
      
      const puppeteerConfig = config.getPuppeteerConfig();
      
      expect(puppeteerConfig.executablePath).toBe('/path/to/chrome');
      
      // Restore original config
      Object.assign(config.puppeteer, originalConfig);
    });

    it('should handle S3 configuration edge cases', () => {
      // Test S3 configuration with partial missing values
      const originalConfig = { ...config.s3 };
      
      config.s3.bucket = '';
      config.s3.endpointUrl = '';
      
      expect(config.isS3Configured()).toBe(false);
      
      // Restore original config
      Object.assign(config.s3, originalConfig);
    });
  });
});