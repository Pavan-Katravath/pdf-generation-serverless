// Mock all dependencies first
jest.mock('../../../src/helpers/s3Operations', () => ({
  s3FSRFileOperations: jest.fn()
}));
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/config');

const getPDFHandler = require('../../../src/handlers/getPDF');
const s3Operations = require('../../../src/helpers/s3Operations');
const logger = require('../../../src/utils/logger');
const config = require('../../../src/utils/config');

describe('GetPDF Handler', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock logger
    logger.logRequestStart = jest.fn();
    logger.logS3Operation = jest.fn();
    logger.logResponse = jest.fn();
    logger.error = jest.fn();
    logger.warn = jest.fn();

    // Mock config
    config.isS3Configured = jest.fn().mockReturnValue(true);

    // Mock s3Operations - ensure it's properly mocked
    s3Operations.s3FSRFileOperations.mockResolvedValue(Buffer.from('mock-pdf-content'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful PDF Retrieval', () => {
    it('should retrieve PDF successfully with valid call_no', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/pdf');
      expect(result.headers['Content-Disposition']).toBe('attachment; filename="TEST123.pdf"');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.isBase64Encoded).toBe(true);
      expect(result.body).toBe(Buffer.from('mock-pdf-content').toString('base64'));
    });

    it('should handle lowercase call_no', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'test123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Disposition']).toBe('attachment; filename="test123.pdf"');
      expect(s3Operations.s3FSRFileOperations).toHaveBeenCalledWith(
        'read',
        'test123.pdf',
        '',
        'test123',
        expect.stringMatching(/^fsr\/\d{4}$/)
      );
    });

    it('should handle special characters in call_no', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST-123 & "Special"' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Disposition']).toBe('attachment; filename="TEST-123 & \"Special\".pdf"');
      expect(s3Operations.s3FSRFileOperations).toHaveBeenCalledWith(
        'read',
        'test-123 & "special".pdf',
        '',
        'test-123 & "special"',
        expect.stringMatching(/^fsr\/\d{4}$/)
      );
    });

    it('should use correct S3 path with current year', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      await getPDFHandler.handler(event);

      const expectedPath = `fsr/${new Date().getFullYear()}`;
      expect(s3Operations.s3FSRFileOperations).toHaveBeenCalledWith(
        'read',
        'test123.pdf',
        '',
        'test123',
        expectedPath
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 400 error when call_no is missing', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: {}
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(400);
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('call_no parameter is required');
    });

    it('should return 400 error when call_no is null', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: null }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('call_no parameter is required');
    });

    it('should return 400 error when call_no is empty string', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: '' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('call_no parameter is required');
    });

    it('should return 404 error when PDF is not found', async () => {
      s3Operations.s3FSRFileOperations.mockResolvedValue(null);

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(404);
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('PDF not found');
    });

    it('should return 404 error when PDF content is empty', async () => {
      s3Operations.s3FSRFileOperations.mockResolvedValue(null);

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error).toBe('PDF not found');
    });

    it('should handle S3 read errors gracefully', async () => {
      s3Operations.s3FSRFileOperations.mockRejectedValue(new Error('S3 read failed'));

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(404);
      expect(logger.logS3Operation).toHaveBeenCalledWith('read', 'TEST123.pdf', 'FAILED', 'S3 read failed');
    });

    it('should handle general errors and return 500', async () => {
      // Mock config to throw an error during the main execution
      config.isS3Configured.mockImplementation(() => {
        throw new Error('Config error');
      });

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(500);
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Config error');
    });
  });

  describe('S3 Configuration', () => {
    it('should skip S3 operations when not configured', async () => {
      config.isS3Configured.mockReturnValue(false);

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(404);
      expect(s3Operations.s3FSRFileOperations).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('S3 not configured - cannot retrieve PDF');
    });

    it('should handle S3 configuration check errors', async () => {
      config.isS3Configured.mockImplementation(() => {
        throw new Error('Config check failed');
      });

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Config check failed');
    });
  });

  describe('Logging', () => {
    it('should log request start with correct parameters', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      await getPDFHandler.handler(event);

      expect(logger.logRequestStart).toHaveBeenCalledWith(
        'report.getpdf',
        'GET',
        { call_no: 'TEST123' },
        'test-agent'
      );
    });

    it('should log successful S3 operation', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      await getPDFHandler.handler(event);

      expect(logger.logS3Operation).toHaveBeenCalledWith('read', 'TEST123.pdf', 'SUCCESS');
    });

    it('should log successful response', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      await getPDFHandler.handler(event);

      expect(logger.logResponse).toHaveBeenCalledWith(
        'report.getpdf',
        expect.objectContaining({
          message: 'PDF retrieved successfully',
          fileName: 'TEST123.pdf',
          size: Buffer.from('mock-pdf-content').length
        }),
        'test-agent'
      );
    });

    it('should log error response', async () => {
      s3Operations.s3FSRFileOperations.mockRejectedValue(new Error('S3 error'));

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      await getPDFHandler.handler(event);

      expect(logger.logResponse).toHaveBeenCalledWith(
        'report.getpdf',
        { error: 'PDF not found' },
        'test-agent'
      );
    });

    it('should handle missing user agent', async () => {
      const event = {
        headers: {},
        queryStringParameters: { call_no: 'TEST123' }
      };

      await getPDFHandler.handler(event);

      expect(logger.logRequestStart).toHaveBeenCalledWith(
        'report.getpdf',
        'GET',
        { call_no: 'TEST123' },
        ''
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null event', async () => {
      const result = await getPDFHandler.handler(null);

      expect(result.statusCode).toBe(500);
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(JSON.parse(result.body).error).toContain('Cannot read properties of null');
    });

    it('should handle undefined event', async () => {
      const result = await getPDFHandler.handler(undefined);

      expect(result.statusCode).toBe(500);
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(JSON.parse(result.body).error).toContain('Cannot read properties of undefined');
    });

    it('should handle null queryStringParameters', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: null
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('call_no parameter is required');
    });

    it('should handle undefined queryStringParameters', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('call_no parameter is required');
    });

    it('should handle very long call_no', async () => {
      const longCallNo = 'A'.repeat(1000);
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: longCallNo }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Operations.s3FSRFileOperations).toHaveBeenCalledWith(
        'read',
        `${longCallNo.toLowerCase()}.pdf`,
        '',
        longCallNo.toLowerCase(),
        expect.stringMatching(/^fsr\/\d{4}$/)
      );
    });

    it('should handle binary PDF content', async () => {
      const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      s3Operations.s3FSRFileOperations.mockResolvedValue(binaryContent);

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(binaryContent.toString('base64'));
    });

    it('should handle special characters in filename', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST/123:456*789?' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Disposition']).toBe('attachment; filename="TEST/123:456*789?.pdf"');
    });
  });

  describe('Response Format', () => {
    it('should return correct headers for successful response', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.headers).toEqual({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="TEST123.pdf"',
        'Access-Control-Allow-Origin': '*'
      });
    });

    it('should return correct headers for error response', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: {}
      };

      const result = await getPDFHandler.handler(event);

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
    });

    it('should return base64 encoded PDF content', async () => {
      const pdfContent = Buffer.from('test pdf content');
      s3Operations.s3FSRFileOperations.mockResolvedValue(pdfContent);

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.isBase64Encoded).toBe(true);
      expect(result.body).toBe(pdfContent.toString('base64'));
    });

    it('should handle S3 not configured scenario', async () => {
      // Mock config to return false for S3 configuration
      config.isS3Configured = jest.fn().mockReturnValue(false);
      
      const event = {
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(404);
      expect(logger.warn).toHaveBeenCalledWith('S3 not configured - cannot retrieve PDF');
    });

    it('should handle S3 read success with lowercase call_no', async () => {
      const pdfContent = Buffer.from('mock-pdf-content');
      s3Operations.s3FSRFileOperations = jest.fn().mockResolvedValue(pdfContent);
      
      const event = {
        queryStringParameters: { call_no: 'test123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(200);
      expect(s3Operations.s3FSRFileOperations).toHaveBeenCalledWith(
        'read',
        'test123.pdf',
        '',
        'test123',
        `fsr/${new Date().getFullYear()}`
      );
    });

    it('should handle S3 read failure with error logging', async () => {
      s3Operations.s3FSRFileOperations.mockRejectedValue(new Error('S3 error'));
      
      const event = {
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(404);
      expect(logger.logS3Operation).toHaveBeenCalledWith('read', 'TEST123.pdf', 'FAILED', 'S3 error');
    });

    it('should handle general errors and return 500', async () => {
      // Mock config to throw an error
      config.isS3Configured = jest.fn().mockImplementation(() => {
        throw new Error('Config error');
      });
      
      const event = {
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toContain('Config error');
    });
  });

  describe('Coverage Gaps', () => {
    it('should log S3 operation success (line 31)', async () => {
      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      await getPDFHandler.handler(event);

      expect(logger.logS3Operation).toHaveBeenCalledWith('read', 'TEST123.pdf', 'SUCCESS');
    });

    it('should log S3 not configured warning (line 36)', async () => {
      config.isS3Configured.mockReturnValue(false);

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      await getPDFHandler.handler(event);

      expect(logger.warn).toHaveBeenCalledWith('S3 not configured - cannot retrieve PDF');
    });

    it('should return PDF content success response (lines 40-47)', async () => {
      const pdfContent = Buffer.from('test-pdf-content');
      s3Operations.s3FSRFileOperations.mockResolvedValue(pdfContent);

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/pdf');
      expect(result.headers['Content-Disposition']).toBe('attachment; filename="TEST123.pdf"');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.body).toBe(Buffer.from('mock-pdf-content').toString('base64'));
      expect(result.isBase64Encoded).toBe(true);
      
      expect(logger.logResponse).toHaveBeenCalledWith(
        'report.getpdf',
        expect.objectContaining({
          message: 'PDF retrieved successfully',
          fileName: 'TEST123.pdf',
          size: pdfContent.length
        }),
        'test-agent'
      );
    });

    it('should handle general errors and return 500 (lines 72-77)', async () => {
      // Mock config to throw an error during execution
      config.isS3Configured.mockImplementation(() => {
        throw new Error('Unexpected system error');
      });

      const event = {
        headers: { 'user-agent': 'test-agent' },
        queryStringParameters: { call_no: 'TEST123' }
      };

      const result = await getPDFHandler.handler(event);

      expect(result.statusCode).toBe(500);
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(JSON.parse(result.body).error).toBe('Unexpected system error');
      
      expect(logger.error).toHaveBeenCalledWith('PDF retrieval failed:', 'Unexpected system error');
      expect(logger.logResponse).toHaveBeenCalledWith(
        'report.getpdf',
        { error: 'Unexpected system error' },
        'test-agent'
      );
    });

  });
});
