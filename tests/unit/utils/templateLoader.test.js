const path = require('path');

// Mock fs module before requiring templateLoader
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true), // Default to true to avoid warnings during module load
  readFileSync: jest.fn(() => '<html><body>Mock template</body></html>')
}));

// Mock console methods to avoid test output noise
const consoleSpy = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

global.console = consoleSpy;

const fs = require('fs');
const templateLoader = require('../../../src/utils/templateLoader');

describe('TemplateLoader', () => {
  const mockTemplateDir = path.join(__dirname, '../../../src/templates');
  const mockTemplateContent = '<html><body><div id="customerName"></div><div id="fsrNumber"></div><div id="fsrDateAndTime"></div><div id="serviceType"></div><div id="observation"></div><div id="workDone"></div><div id="recommendation"></div></body></html>';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock fs.existsSync to return true for thermal.html
    fs.existsSync.mockImplementation((filePath) => {
      return filePath.includes('thermal.html');
    });
    
    // Mock fs.readFileSync to return mock content
    fs.readFileSync.mockReturnValue(mockTemplateContent);
    
    // Clear the templates object to start fresh
    templateLoader.templates = {};
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should have correct template directory', () => {
      expect(templateLoader.templateDir).toBe(mockTemplateDir);
    });

    it('should load templates when loadTemplates is called', () => {
      templateLoader.loadTemplates();
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.join(mockTemplateDir, 'thermal.html')
      );
    });
  });

  describe('loadTemplates', () => {
    it('should load thermal template successfully', () => {
      templateLoader.loadTemplates();
      
      expect(fs.existsSync).toHaveBeenCalledWith(
        path.join(mockTemplateDir, 'thermal.html')
      );
      expect(fs.readFileSync).toHaveBeenCalledWith(
        path.join(mockTemplateDir, 'thermal.html'),
        'utf8'
      );
      expect(templateLoader.templates.thermal).toBe(mockTemplateContent);
    });

    it('should handle missing template files gracefully', () => {
      fs.existsSync.mockReturnValue(false);
      
      templateLoader.loadTemplates();
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Template file not found')
      );
      expect(templateLoader.templates.thermal).toBeUndefined();
    });

    it('should handle file read errors gracefully', () => {
      const error = new Error('File read error');
      fs.readFileSync.mockImplementation(() => {
        throw error;
      });
      
      templateLoader.loadTemplates();
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load template thermal'),
        error.message
      );
    });

    it('should log successful template loading', () => {
      templateLoader.loadTemplates();
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Loaded template: thermal');
    });
  });

  describe('getTemplate', () => {
    beforeEach(() => {
      templateLoader.loadTemplates();
    });

    it('should return template content for existing template', () => {
      const result = templateLoader.getTemplate('thermal');
      expect(result).toBe(mockTemplateContent);
    });

    it('should throw error for non-existent template', () => {
      expect(() => templateLoader.getTemplate('nonexistent')).toThrow(
        'Template nonexistent not found. Available templates: thermal'
      );
    });

    it('should list available templates in error message', () => {
      expect(() => templateLoader.getTemplate('invalid')).toThrow(
        'Template invalid not found. Available templates: thermal'
      );
    });
  });

  describe('getAllTemplates', () => {
    beforeEach(() => {
      templateLoader.loadTemplates();
    });

    it('should return all loaded templates', () => {
      const result = templateLoader.getAllTemplates();
      expect(result).toEqual({ thermal: mockTemplateContent });
    });

    it('should return empty object when no templates loaded', () => {
      fs.existsSync.mockReturnValue(false);
      templateLoader.templates = {}; // Clear templates first
      templateLoader.loadTemplates();
      
      const result = templateLoader.getAllTemplates();
      expect(result).toEqual({});
    });
  });

  describe('getTemplateNames', () => {
    beforeEach(() => {
      templateLoader.loadTemplates();
    });

    it('should return array of template names', () => {
      const result = templateLoader.getTemplateNames();
      expect(result).toEqual(['thermal']);
    });

    it('should return empty array when no templates loaded', () => {
      fs.existsSync.mockReturnValue(false);
      templateLoader.templates = {}; // Clear templates first
      templateLoader.loadTemplates();
      
      const result = templateLoader.getTemplateNames();
      expect(result).toEqual([]);
    });
  });

  describe('validateTemplate', () => {
    beforeEach(() => {
      templateLoader.loadTemplates();
    });

    it('should return true for valid template with all required elements', () => {
      const result = templateLoader.validateTemplate('thermal');
      expect(result).toBe(true);
    });

    it('should return false and warn for template missing required elements', () => {
      const incompleteTemplate = '<html><body></body></html>';
      fs.readFileSync.mockReturnValue(incompleteTemplate);
      
      templateLoader.templates = {}; // Clear templates first
      templateLoader.loadTemplates();
      const result = templateLoader.validateTemplate('thermal');
      
      expect(result).toBe(false);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Template thermal missing elements'),
        expect.any(Array)
      );
    });

    it('should handle template validation errors gracefully', () => {
      // Test with a non-existent template
      expect(() => templateLoader.validateTemplate('nonexistent')).toThrow();
    });
  });

  describe('getRequiredElements', () => {
    it('should return common elements for unknown template', () => {
      const result = templateLoader.getRequiredElements('unknown');
      expect(result).toEqual(['customerName', 'fsrNumber', 'fsrDateAndTime']);
    });

    it('should return extended elements for thermal template', () => {
      const result = templateLoader.getRequiredElements('thermal');
      expect(result).toEqual([
        'customerName', 
        'fsrNumber', 
        'fsrDateAndTime',
        'serviceType', 
        'observation', 
        'workDone', 
        'recommendation'
      ]);
    });
  });

  describe('validateAllTemplates', () => {
    beforeEach(() => {
      templateLoader.loadTemplates();
    });

    it('should validate all loaded templates', () => {
      const result = templateLoader.validateAllTemplates();
      expect(result).toEqual({ thermal: true });
    });

    it('should handle empty templates gracefully', () => {
      fs.existsSync.mockReturnValue(false);
      templateLoader.templates = {}; // Clear templates first
      templateLoader.loadTemplates();
      
      const result = templateLoader.validateAllTemplates();
      expect(result).toEqual({});
    });

    it('should validate multiple templates', () => {
      // Mock multiple templates
      fs.existsSync.mockImplementation((filePath) => {
        return filePath.includes('.html');
      });
      
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('thermal.html')) {
          return mockTemplateContent;
        }
        return '<html><body></body></html>';
      });
      
      // Override loadTemplates to load multiple templates
      templateLoader.templates = {
        thermal: mockTemplateContent,
        invalid: '<html><body></body></html>'
      };
      
      const result = templateLoader.validateAllTemplates();
      expect(result).toHaveProperty('thermal');
      expect(result).toHaveProperty('invalid');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle fs module errors gracefully', () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });
      
      // Clear templates first to ensure clean state
      templateLoader.templates = {};
      templateLoader.loadTemplates();
      
      // Should not throw, but should log error
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Failed to load template thermal:',
        'File system error'
      );
    });

    it('should handle template content with special characters', () => {
      const specialContent = '<html><body>Test & "quoted" <tag> content</body></html>';
      fs.readFileSync.mockReturnValue(specialContent);
      
      templateLoader.templates = {}; // Clear templates first
      templateLoader.loadTemplates();
      const result = templateLoader.getTemplate('thermal');
      
      expect(result).toBe(specialContent);
    });

    it('should handle template validation with missing elements', () => {
      const incompleteTemplate = '<html><body><div id="customerName"></div></body></html>';
      fs.readFileSync.mockReturnValue(incompleteTemplate);
      
      templateLoader.templates = {}; // Clear templates first
      templateLoader.loadTemplates();
      const result = templateLoader.validateTemplate('thermal');
      
      expect(result).toBe(false);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Template thermal missing elements'),
        expect.any(Array)
      );
    });
  });
});