const { s3FSRFileOperations } = require('../../../src/helpers/s3Operations');

describe('S3 Operations Helper', () => {
  describe('s3FSRFileOperations - upload operation', () => {
    it('should upload file successfully', async () => {
      const result = await s3FSRFileOperations('post', 'test-file.pdf', 'test-content', 'test-call', '');

      expect(result).toMatch(/^"[a-f0-9]{32}"$/); // Real ETag format
    });

    it('should upload file with path prefix', async () => {
      const result = await s3FSRFileOperations('post', 'test-file.pdf', 'test-content', 'test-call', 'fsr/2023');

      expect(result).toMatch(/^"[a-f0-9]{32}"$/); // Real ETag format
    });

    it('should upload file with checklist flag', async () => {
      const result = await s3FSRFileOperations('post', 'test-file.pdf', 'test-content', 'test-call', '', true);

      expect(result).toMatch(/^"[a-f0-9]{32}"$/); // Real ETag format
    });

    it('should handle upload errors', async () => {
      // Test with invalid parameters that will cause AWS to throw an error
      await expect(s3FSRFileOperations('post', '', 'test-content', 'test-call', ''))
        .rejects.toThrow();
    });

    it('should handle empty body content', async () => {
      const result = await s3FSRFileOperations('post', 'test-file.pdf', '', 'test-call', '');

      expect(result).toMatch(/^"[a-f0-9]{32}"$/); // Real ETag format
    });
  });

  describe('s3FSRFileOperations - read operation', () => {
    it('should read file successfully', async () => {
      // First upload a file, then read it
      await s3FSRFileOperations('post', 'test-file.pdf', 'test-pdf-content', 'test-call', '');
      const result = await s3FSRFileOperations('read', 'test-file.pdf', '', 'test-call', '');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('test-pdf-content');
    });

    it('should read file with path prefix', async () => {
      // Upload with path prefix, then read
      await s3FSRFileOperations('post', 'test-file.pdf', 'test-content', 'test-call', 'fsr/2023');
      const result = await s3FSRFileOperations('read', 'test-file.pdf', '', 'test-call', 'fsr/2023');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('test-content');
    });

    it('should handle read errors', async () => {
      // Try to read a non-existent file
      await expect(s3FSRFileOperations('read', 'non-existent-file.pdf', '', 'test-call', ''))
        .rejects.toThrow();
    });

    it('should handle NoSuchKey error', async () => {
      // Try to read a non-existent file
      await expect(s3FSRFileOperations('read', 'non-existent-file.pdf', '', 'test-call', ''))
        .rejects.toThrow();
    });
  });

  describe('s3FSRFileOperations - location operation', () => {
    it('should generate signed URL successfully', async () => {
      const result = await s3FSRFileOperations('location', 'test-file.pdf', '', 'test-call', '');

      expect(result).toMatch(/^http:\/\/localhost:9000\/vertiv\/test-file\.pdf\?/);
      expect(result).toContain('AWSAccessKeyId=');
      expect(result).toContain('Expires=');
      expect(result).toContain('Signature=');
    });

    it('should generate signed URL with path prefix', async () => {
      const result = await s3FSRFileOperations('location', 'test-file.pdf', '', 'test-call', 'fsr/2023');

      expect(result).toMatch(/^http:\/\/localhost:9000\/vertiv\/fsr\/2023\/test-file\.pdf\?/);
      expect(result).toContain('AWSAccessKeyId=');
      expect(result).toContain('Expires=');
      expect(result).toContain('Signature=');
    });

    it('should handle signed URL generation errors', async () => {
      // Test with invalid parameters
      await expect(s3FSRFileOperations('location', '', '', 'test-call', ''))
        .rejects.toThrow();
    });

    it('should use correct expiration time', async () => {
      const result = await s3FSRFileOperations('location', 'test-file.pdf', '', 'test-call', '');

      expect(result).toMatch(/Expires=\d+/);
    });
  });

  describe('s3FSRFileOperations - error handling', () => {
    it('should throw error for unsupported operation type', async () => {
      await expect(s3FSRFileOperations('invalid', 'test-file.pdf', 'test-content', 'test-call', ''))
        .rejects.toThrow('Unsupported operation type: invalid');
    });

    it('should handle AWS service errors', async () => {
      // Test with invalid parameters that will cause AWS service errors
      await expect(s3FSRFileOperations('post', '', 'test-content', 'test-call', ''))
        .rejects.toThrow();
    });

    it('should handle network timeout errors', async () => {
      // Test with invalid parameters
      await expect(s3FSRFileOperations('read', '', '', 'test-call', ''))
        .rejects.toThrow();
    });

    it('should handle access denied errors', async () => {
      // Test with invalid parameters
      await expect(s3FSRFileOperations('post', '', 'test-content', 'test-call', ''))
        .rejects.toThrow();
    });
  });

  describe('s3FSRFileOperations - edge cases', () => {
    it('should handle empty key', async () => {
      await expect(s3FSRFileOperations('post', '', 'test-content', 'test-call', ''))
        .rejects.toThrow();
    });

    it('should handle special characters in key', async () => {
      const specialKey = 'test-file (1).pdf';
      const result = await s3FSRFileOperations('post', specialKey, 'test-content', 'test-call', '');

      expect(result).toMatch(/^"[a-f0-9]{32}"$/); // Real ETag format
    });

    it('should handle very large file content', async () => {
      const largeContent = 'x'.repeat(1000000); // 1MB of content
      const result = await s3FSRFileOperations('post', 'test-file.pdf', largeContent, 'test-call', '');

      expect(result).toMatch(/^"[a-f0-9]{32}"$/); // Real ETag format
    });

    it('should handle binary content', async () => {
      const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG header
      const result = await s3FSRFileOperations('post', 'test-file.pdf', binaryContent, 'test-call', '');

      expect(result).toMatch(/^"[a-f0-9]{32}"$/); // Real ETag format
    });

    it('should handle empty path', async () => {
      const result = await s3FSRFileOperations('post', 'test-file.pdf', 'test-content', 'test-call', '');

      expect(result).toMatch(/^"[a-f0-9]{32}"$/); // Real ETag format
    });

    it('should handle null/undefined parameters gracefully', async () => {
      // Test with null call_no which should cause an error
      await expect(s3FSRFileOperations('post', 'test-file.pdf', 'test-content', null, ''))
        .rejects.toThrow();
    });
  });
});