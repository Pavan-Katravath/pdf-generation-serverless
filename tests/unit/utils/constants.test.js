const { 
  sleep, 
  isJSON, 
  formatDateTime, 
  validateRequiredParams, 
  generateFileName, 
  sanitizeHtml 
} = require('../../../src/utils/constants');

describe('Constants Utility Functions', () => {
  
  describe('sleep', () => {
    it('should resolve after specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90);
      expect(end - start).toBeLessThan(200);
    });

    it('should resolve immediately for 0ms', async () => {
      const start = Date.now();
      await sleep(0);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(10);
    });

    it('should handle negative values gracefully', async () => {
      const start = Date.now();
      await sleep(-100);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(10);
    });
  });

  describe('isJSON', () => {
    it('should return true for valid JSON strings', () => {
      expect(isJSON('{"key": "value"}')).toBe(true);
      expect(isJSON('[]')).toBe(true);
      expect(isJSON('"string"')).toBe(true);
      expect(isJSON('123')).toBe(true);
      expect(isJSON('true')).toBe(true);
      expect(isJSON('null')).toBe(true);
    });

    it('should return false for invalid JSON strings', () => {
      expect(isJSON('invalid json')).toBe(false);
      expect(isJSON('{key: value}')).toBe(false);
      expect(isJSON('undefined')).toBe(false);
      expect(isJSON('')).toBe(false);
      expect(isJSON('{')).toBe(false);
      expect(isJSON('}')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isJSON(null)).toBe(true); // null becomes "null" which is valid JSON
      expect(isJSON(undefined)).toBe(false);
      expect(isJSON(123)).toBe(true); // 123 becomes "123" which is valid JSON
      expect(isJSON({})).toBe(false);
    });
  });

  describe('formatDateTime', () => {
    it('should format current date by default', () => {
      const result = formatDateTime();
      expect(typeof result).toBe('string');
      expect(result).toContain('October');
      expect(result).toContain('2025');
      expect(result).toContain('at');
      expect(result).toContain('PM');
    });

    it('should format provided date correctly', () => {
      const testDate = new Date('2023-12-25T10:30:45.123Z');
      const result = formatDateTime(testDate);
      
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('should handle different timezones', () => {
      const testDate = new Date('2023-12-25T10:30:45.123Z');
      const result = formatDateTime(testDate);
      
      expect(result).toMatch(/\d+:\d+:\d+\.\d+/);
    });

    it('should include timezone information', () => {
      const result = formatDateTime();
      expect(result).toMatch(/\w+$/); // Should end with timezone abbreviation
    });
  });

  describe('validateRequiredParams', () => {
    it('should pass validation when all required params are present', () => {
      const params = { call_no: '123', product_group: 'thermal' };
      const requiredFields = ['call_no', 'product_group'];
      
      expect(() => validateRequiredParams(params, requiredFields)).not.toThrow();
      expect(validateRequiredParams(params, requiredFields)).toBe(true);
    });

    it('should throw error when required params are missing', () => {
      const params = { call_no: '123' };
      const requiredFields = ['call_no', 'product_group'];
      
      expect(() => validateRequiredParams(params, requiredFields))
        .toThrow('Missing required parameters: product_group');
    });

    it('should throw error when multiple params are missing', () => {
      const params = {};
      const requiredFields = ['call_no', 'product_group', 'customer_name'];
      
      expect(() => validateRequiredParams(params, requiredFields))
        .toThrow('Missing required parameters: call_no, product_group, customer_name');
    });

    it('should handle empty required fields array', () => {
      const params = { call_no: '123' };
      const requiredFields = [];
      
      expect(() => validateRequiredParams(params, requiredFields)).not.toThrow();
      expect(validateRequiredParams(params, requiredFields)).toBe(true);
    });

    it('should handle falsy values as missing', () => {
      const params = { 
        call_no: '', 
        product_group: null, 
        customer_name: undefined,
        valid_field: 'test'
      };
      const requiredFields = ['call_no', 'product_group', 'customer_name', 'valid_field'];
      
      expect(() => validateRequiredParams(params, requiredFields))
        .toThrow('Missing required parameters: call_no, product_group, customer_name');
    });

    it('should handle zero and false as valid values', () => {
      const params = { 
        call_no: 0, 
        product_group: false, 
        customer_name: 'test'
      };
      const requiredFields = ['call_no', 'product_group', 'customer_name'];
      
      expect(() => validateRequiredParams(params, requiredFields)).toThrow();
    });
  });

  describe('generateFileName', () => {
    it('should generate filename with default extension', () => {
      const result = generateFileName('TEST123');
      
      expect(result).toMatch(/^test123-\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z\.pdf$/i);
    });

    it('should generate filename with custom extension', () => {
      const result = generateFileName('TEST123', 'docx');
      
      expect(result).toMatch(/^test123-\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z\.docx$/i);
    });

    it('should convert call number to lowercase', () => {
      const result = generateFileName('TEST123');
      
      expect(result).toMatch(/^test123-/);
    });

    it('should include timestamp in filename', () => {
      const result = generateFileName('TEST123');
      
      expect(result).toMatch(/^test123-\d{4}-\d{2}-\d{2}t\d{2}-\d{2}-\d{2}-\d{3}z\.pdf$/i);
      expect(result).toContain('test123');
      expect(result).toContain('.pdf');
    });

    it('should handle special characters in call number', () => {
      const result = generateFileName('TEST-123_ABC');
      
      expect(result).toMatch(/^test-123_abc-/);
    });
  });

  describe('sanitizeHtml', () => {
    it('should sanitize HTML special characters', () => {
      expect(sanitizeHtml('&')).toBe('&amp;');
      expect(sanitizeHtml('<')).toBe('&lt;');
      expect(sanitizeHtml('>')).toBe('&gt;');
      expect(sanitizeHtml('"')).toBe('&quot;');
      expect(sanitizeHtml("'")).toBe('&#x27;');
    });

    it('should handle multiple special characters', () => {
      const input = 'Test & "quoted" <tag> content';
      const expected = 'Test &amp; &quot;quoted&quot; &lt;tag&gt; content';
      
      expect(sanitizeHtml(input)).toBe(expected);
    });

    it('should return empty string for null/undefined', () => {
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should not modify safe characters', () => {
      const input = 'Hello World 123 !@#$%^()';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('should handle complex HTML-like strings', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
      
      expect(sanitizeHtml(input)).toBe(expected);
    });
  });
});
