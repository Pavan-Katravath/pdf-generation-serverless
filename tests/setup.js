// Test setup file for Jest
const AWS = require('aws-sdk-mock');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'OdJTvIf88W6W4HNm5wn5';
process.env.AWS_SECRET_ACCESS_KEY = 'YLYwa9qw3Lnzrp9bmQF4IOXhztdHdMo2ZbqtE0W4';
process.env.S3_BUCKET = 'vertiv';
process.env.S3_ENDPOINT_URL = 'http://localhost:9000';
process.env.S3_FORCE_PATH_STYLE = 'true';
process.env.STAGE = 'test';
process.env.FSR_REATTEMPT_TIMEOUT = '5000';
process.env.PRESIGNED_URL_EXPIRE = '3600';
process.env.ENABLE_VERTIV_LOGS = 'false';

// Global test utilities
global.testUtils = {
  // Mock event objects
  createMockEvent: (body = {}, headers = {}, queryStringParameters = {}) => ({
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      'user-agent': 'test-agent',
      'content-type': 'application/json',
      ...headers
    },
    queryStringParameters: queryStringParameters || null
  }),
  
  // Mock Lambda context
  createMockContext: () => ({
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]test-stream',
    getRemainingTimeInMillis: () => 30000
  }),
  
  // Mock S3 responses
  mockS3Upload: () => ({
    ETag: '"test-etag"',
    Location: 'https://test-bucket.s3.amazonaws.com/test-file.pdf',
    Bucket: 'test-bucket',
    Key: 'test-file.pdf'
  }),
  
  mockS3GetObject: () => ({
    Body: Buffer.from('test-pdf-content'),
    ContentType: 'application/pdf',
    LastModified: new Date(),
    ETag: '"test-etag"'
  }),
  
  mockS3GetSignedUrl: () => 'https://test-bucket.s3.amazonaws.com/test-file.pdf?signature=test',
  
  // Mock PDF buffer
  createMockPDFBuffer: () => Buffer.from('mock-pdf-content'),
  
  // Mock browser page
  createMockPage: () => ({
    setContent: jest.fn().mockResolvedValue(),
    pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
    close: jest.fn().mockResolvedValue()
  }),
  
  // Mock browser
  createMockBrowser: () => ({
    newPage: jest.fn().mockResolvedValue(global.testUtils.createMockPage()),
    close: jest.fn().mockResolvedValue()
  })
};

// Setup AWS SDK mocks
beforeEach(() => {
  AWS.restore();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
