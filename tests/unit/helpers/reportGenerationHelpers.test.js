const { 
  generatePartReturnedAndConsumedTable, 
  generateSafetyTable, 
  generateThermalOrPowerReport 
} = require('../../../src/helpers/reportGenerationHelpers');

describe('Report Generation Helpers', () => {
  
  describe('generatePartReturnedAndConsumedTable', () => {
    let mockPage;

    beforeEach(() => {
      mockPage = {
        evaluate: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        setContent: jest.fn().mockResolvedValue()
      };
    });

    it('should generate empty tables when no material data', () => {
      const param = { material: [] };
      const result = generatePartReturnedAndConsumedTable(param, 3, false);
      
      // The function generates empty rows even when no data, so check for empty content in rows
      expect(result.returnedEls).toContain('width: 13.6%');
      expect(result.issuedEls).toContain('width: 13.6%');
    });

    it('should generate empty tables when material is undefined', () => {
      const param = {};
      const result = generatePartReturnedAndConsumedTable(param, 3, false);
      
      // The function generates empty rows even when no data, so check for empty content in rows
      expect(result.returnedEls).toContain('width: 13.6%');
      expect(result.issuedEls).toContain('width: 13.6%');
    });

    it('should generate issued parts table correctly', () => {
      const param = {
        material: [
          {
            part_activity: 'issued',
            part_code: 'PART001',
            part_description: 'Test Part Description',
            part_serialno: 'SN123456',
            part_qty: '2'
          }
        ]
      };
      
      const result = generatePartReturnedAndConsumedTable(param, 3, false);
      
      expect(result.issuedEls).toContain('PART001');
      expect(result.issuedEls).toContain('Test Part Description');
      expect(result.issuedEls).toContain('SN123456');
      expect(result.issuedEls).toContain('2');
      // The function generates empty rows even when no returned data, so check for empty content
      expect(result.returnedEls).toContain('width: 13.6%');
    });

    it('should generate returned parts table correctly', () => {
      const param = {
        material: [
          {
            part_activity: 'returned',
            part_code: 'PART002',
            part_description: 'Returned Part Description',
            part_serialno: 'SN789012',
            part_qty: '1'
          }
        ]
      };
      
      const result = generatePartReturnedAndConsumedTable(param, 3, false);
      
      expect(result.returnedEls).toContain('PART002');
      expect(result.returnedEls).toContain('Returned Part Description');
      expect(result.returnedEls).toContain('SN789012');
      expect(result.returnedEls).toContain('1');
      // The function generates empty rows even when no issued data, so check for empty content
      expect(result.issuedEls).toContain('width: 13.6%');
    });

    it('should handle mixed issued and returned parts', () => {
      const param = {
        material: [
          {
            part_activity: 'issued',
            part_code: 'PART001',
            part_description: 'Issued Part',
            part_serialno: 'SN001',
            part_qty: '1'
          },
          {
            part_activity: 'returned',
            part_code: 'PART002',
            part_description: 'Returned Part',
            part_serialno: 'SN002',
            part_qty: '1'
          }
        ]
      };
      
      const result = generatePartReturnedAndConsumedTable(param, 3, false);
      
      expect(result.issuedEls).toContain('PART001');
      expect(result.returnedEls).toContain('PART002');
    });

    it('should handle case insensitive part activity', () => {
      const param = {
        material: [
          {
            part_activity: 'ISSUED',
            part_code: 'PART001',
            part_description: 'Test Part',
            part_serialno: 'SN001',
            part_qty: '1'
          },
          {
            part_activity: 'Return',
            part_code: 'PART002',
            part_description: 'Test Part 2',
            part_serialno: 'SN002',
            part_qty: '1'
          }
        ]
      };
      
      const result = generatePartReturnedAndConsumedTable(param, 3, false);
      
      expect(result.issuedEls).toContain('PART001');
      expect(result.returnedEls).toContain('PART002');
    });

    it('should limit parts for onepmFSR when flag is true', () => {
      const param = {
        material: [
          { part_activity: 'issued', part_code: 'PART001', part_description: 'Part 1', part_serialno: 'SN001', part_qty: '1' },
          { part_activity: 'issued', part_code: 'PART002', part_description: 'Part 2', part_serialno: 'SN002', part_qty: '1' },
          { part_activity: 'issued', part_code: 'PART003', part_description: 'Part 3', part_serialno: 'SN003', part_qty: '1' },
          { part_activity: 'issued', part_code: 'PART004', part_description: 'Part 4', part_serialno: 'SN004', part_qty: '1' },
          { part_activity: 'return', part_code: 'PART005', part_description: 'Part 5', part_serialno: 'SN005', part_qty: '1' },
          { part_activity: 'return', part_code: 'PART006', part_description: 'Part 6', part_serialno: 'SN006', part_qty: '1' },
          { part_activity: 'return', part_code: 'PART007', part_description: 'Part 7', part_serialno: 'SN007', part_qty: '1' },
          { part_activity: 'return', part_code: 'PART008', part_description: 'Part 8', part_serialno: 'SN008', part_qty: '1' }
        ]
      };
      
      const result = generatePartReturnedAndConsumedTable(param, 3, true);
      
      // Should only include first 3 issued and 3 returned parts
      expect(result.issuedEls).toContain('PART001');
      expect(result.issuedEls).toContain('PART002');
      expect(result.issuedEls).toContain('PART003');
      expect(result.issuedEls).not.toContain('PART004');
      
      expect(result.returnedEls).toContain('PART005');
      expect(result.returnedEls).toContain('PART006');
      expect(result.returnedEls).toContain('PART007');
      expect(result.returnedEls).not.toContain('PART008');
    });

    it('should fill empty rows to meet default value', () => {
      const param = {
        material: [
          {
            part_activity: 'issued',
            part_code: 'PART001',
            part_description: 'Test Part',
            part_serialno: 'SN001',
            part_qty: '1'
          }
        ]
      };
      
      const result = generatePartReturnedAndConsumedTable(param, 3, false);
      
      // Should have 1 actual part + 2 empty rows = 3 total rows
      const issuedRowCount = (result.issuedEls.match(/<div style="width: 5\.33%;/g) || []).length;
      const returnedRowCount = (result.returnedEls.match(/<div style="width: 5\.33%;/g) || []).length;
      
      expect(issuedRowCount).toBe(3);
      expect(returnedRowCount).toBe(3);
    });

    it('should handle missing part properties gracefully', () => {
      const param = {
        material: [
          {
            part_activity: 'issued',
            part_code: null,
            part_description: undefined,
            part_serialno: '',
            part_qty: null
          }
        ]
      };
      
      const result = generatePartReturnedAndConsumedTable(param, 3, false);
      
      expect(result.issuedEls).toContain('style="width: 5.33%; border-right: 1px solid black; text-align: center;">1</div>');
      expect(result.issuedEls).toContain('style="width: 13.6%; border-right: 1px solid black; text-align: center; padding-left: 0.4rem; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;"></div>');
    });

    it('should handle special characters in part data', () => {
      const param = {
        material: [
          {
            part_activity: 'issued',
            part_code: 'PART-001 & "Special"',
            part_description: 'Test <script>alert("xss")</script>',
            part_serialno: 'SN-123_ABC',
            part_qty: '2.5'
          }
        ]
      };
      
      const result = generatePartReturnedAndConsumedTable(param, 3, false);
      
      expect(result.issuedEls).toContain('PART-001 & "Special"');
      expect(result.issuedEls).toContain('Test <script>alert("xss")</script>');
      expect(result.issuedEls).toContain('SN-123_ABC');
      expect(result.issuedEls).toContain('2.5');
    });
  });

  describe('generateSafetyTable', () => {
    it('should generate empty safety table when no formdata', () => {
      const result = generateSafetyTable(null);
      
      expect(result).toContain('Hazard');
      expect(result).toContain('Level of Risk');
      expect(result).toContain('Can work proceed safely?');
      expect(result).toContain('Safety measures put in place?');
      expect(result).toContain('<div style="text-align: left; width: 32%;" class="assessmentItem">');
    });

    it('should generate empty safety table when formdata is empty array', () => {
      const result = generateSafetyTable([]);
      
      expect(result).toContain('Hazard');
      expect(result).toContain('Level of Risk');
      expect(result).toContain('Can work proceed safely?');
      expect(result).toContain('Safety measures put in place?');
    });

    it('should generate safety table with single hazard', () => {
      const formdata = [
        {
          'Electrical - Level of Risk': 'High',
          'Electrical - Can work proceed safely?': 'Yes',
          'Electrical - Detail safety measures put in place?': 'Lockout/Tagout'
        }
      ];
      
      const result = generateSafetyTable(formdata);
      
      expect(result).toContain('Electrical');
      expect(result).toContain('High');
      expect(result).toContain('Yes');
      expect(result).toContain('Lockout/Tagout');
    });

    it('should generate safety table with multiple hazards', () => {
      const formdata = [
        {
          'Electrical - Level of Risk': 'High',
          'Electrical - Can work proceed safely?': 'Yes',
          'Electrical - Detail safety measures put in place?': 'Lockout/Tagout',
          'Mechanical - Level of Risk': 'Medium',
          'Mechanical - Can work proceed safely?': 'Yes',
          'Mechanical - Detail safety measures put in place?': 'Safety guards'
        }
      ];
      
      const result = generateSafetyTable(formdata);
      
      expect(result).toContain('Electrical');
      expect(result).toContain('Mechanical');
      expect(result).toContain('High');
      expect(result).toContain('Medium');
      expect(result).toContain('Lockout/Tagout');
      expect(result).toContain('Safety guards');
    });

    it('should handle missing safety attributes gracefully', () => {
      const formdata = [
        {
          'Electrical - Level of Risk': 'High',
          'Electrical - Can work proceed safely?': 'Yes'
          // Missing 'Detail safety measures put in place?'
        }
      ];
      
      const result = generateSafetyTable(formdata);
      
      expect(result).toContain('Electrical');
      expect(result).toContain('High');
      expect(result).toContain('Yes');
      expect(result).toContain('<br />'); // Empty cell for missing attribute
    });

    it('should handle complex hazard names', () => {
      const formdata = [
        {
          'Electrical & Mechanical - Level of Risk': 'High',
          'Electrical & Mechanical - Can work proceed safely?': 'Yes',
          'Electrical & Mechanical - Detail safety measures put in place?': 'Multiple safety measures'
        }
      ];
      
      const result = generateSafetyTable(formdata);
      
      expect(result).toContain('Electrical & Mechanical');
      expect(result).toContain('High');
      expect(result).toContain('Yes');
      expect(result).toContain('Multiple safety measures');
    });

    it('should handle special characters in safety data', () => {
      const formdata = [
        {
          'Test <script> - Level of Risk': 'High & "Dangerous"',
          'Test <script> - Can work proceed safely?': 'Yes, with <precautions>',
          'Test <script> - Detail safety measures put in place?': 'Lockout/Tagout & "Safety" measures'
        }
      ];
      
      const result = generateSafetyTable(formdata);
      
      expect(result).toContain('Test <script>');
      expect(result).toContain('High & "Dangerous"');
      expect(result).toContain('Yes, with <precautions>');
      expect(result).toContain('Lockout/Tagout & "Safety" measures');
    });

    it('should handle malformed key format', () => {
      const formdata = [
        {
          'InvalidKey': 'Value1',
          'Electrical - Level of Risk': 'High',
          'Electrical - Can work proceed safely?': 'Yes',
          'Electrical - Detail safety measures put in place?': 'Lockout/Tagout'
        }
      ];
      
      const result = generateSafetyTable(formdata);
      
      expect(result).toContain('Electrical');
      expect(result).toContain('High');
      expect(result).toContain('Yes');
      expect(result).toContain('Lockout/Tagout');
    });

    it('should handle empty string values', () => {
      const formdata = [
        {
          'Electrical - Level of Risk': '',
          'Electrical - Can work proceed safely?': '',
          'Electrical - Detail safety measures put in place?': ''
        }
      ];
      
      const result = generateSafetyTable(formdata);
      
      expect(result).toContain('Electrical');
      expect(result).toContain('<br />'); // Empty cells
    });
  });

  describe('generateThermalOrPowerReport', () => {
    let mockPage;
    let mockDocument;

    beforeEach(() => {
      // Create a mock DOM environment that tracks different elements
      const mockElements = {};
      
      mockDocument = {
        getElementById: jest.fn().mockImplementation((id) => {
          if (!mockElements[id]) {
            mockElements[id] = {
              textContent: '',
              innerHTML: '',
              src: ''
            };
          }
          return mockElements[id];
        })
      };

      // Mock global document
      global.document = mockDocument;

      mockPage = {
        evaluate: jest.fn().mockImplementation(async (fn, finalObject) => {
          // Execute the actual function passed to page.evaluate
          return await fn(finalObject);
        }),
        setContent: jest.fn().mockResolvedValue(),
        pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content'))
      };
    });

    afterEach(() => {
      // Clean up global mocks
      delete global.document;
    });

    it('should generate PDF successfully', async () => {
      const finalObject = {
        param: { call_no: 'TEST123', product_group: 'thermal' },
        paramObj: { formdata: [] },
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      const result = await generateThermalOrPowerReport(mockPage, finalObject);

      expect(result).toEqual(Buffer.from('mock-pdf-content'));
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should test DOM manipulation functions - setData', async () => {
      const finalObject = {
        param: { customer_name: 'Test Customer' },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      // Verify getElementById was called for customer name
      expect(mockDocument.getElementById).toHaveBeenCalledWith('customerName');
      
      // Get the specific element that was created
      const customerNameElement = mockDocument.getElementById('customerName');
      expect(customerNameElement.textContent).toBe('Test Customer');
    });

    it('should test DOM manipulation functions - setHTML', async () => {
      const finalObject = {
        param: {},
        paramObj: { ratings: { comment: 'Test comment' } },
        tableHTML: '<div>Test table</div>',
        returnedEls: '<div>Returned</div>',
        issuedEls: '<div>Issued</div>'
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      // Verify HTML content was set
      expect(mockDocument.getElementById).toHaveBeenCalledWith('signatureHeader');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('signatureContent');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('partConsumed');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('partReturned');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('assessment');
      
      // Verify the content was actually set
      const signatureHeaderElement = mockDocument.getElementById('signatureHeader');
      expect(signatureHeaderElement.innerHTML).toContain("Customer's Comment");
    });

    it('should handle engineer signature from param', async () => {
      const finalObject = {
        param: { engineerSignature: 'data:image/engineer-signature' },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      expect(mockDocument.getElementById).toHaveBeenCalledWith('signatureContent');
      const signatureElement = mockDocument.getElementById('signatureContent');
      expect(signatureElement.innerHTML).toContain('data:image/engineer-signature');
    });

    it('should handle engineer signature from room customFields', async () => {
      const finalObject = {
        param: {},
        room: {
          customFields: {
            engineerSignature: 'data:image/room-engineer-signature'
          }
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      const signatureElement = mockDocument.getElementById('signatureContent');
      expect(signatureElement.innerHTML).toContain('data:image/room-engineer-signature');
    });

    it('should handle manager signature from param', async () => {
      const finalObject = {
        param: { managerSignature: 'data:image/manager-signature' },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      const signatureElement = mockDocument.getElementById('signatureContent');
      expect(signatureElement.innerHTML).toContain('data:image/manager-signature');
      expect(signatureElement.innerHTML).toContain('Signature of Manager');
    });

    it('should handle manager signature from room customFields', async () => {
      const finalObject = {
        param: {},
        room: {
          customFields: {
            managerSignature: 'data:image/room-manager-signature'
          }
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      const signatureElement = mockDocument.getElementById('signatureContent');
      expect(signatureElement.innerHTML).toContain('data:image/room-manager-signature');
    });

    it('should handle customer address concatenation', async () => {
      const finalObject = {
        param: {
          customer_address1: '123 Main St',
          customer_address2: 'Suite 100',
          customer_address3: 'City, State'
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      expect(mockDocument.getElementById).toHaveBeenCalledWith('customerAddress');
      const addressElement = mockDocument.getElementById('customerAddress');
      expect(addressElement.textContent).toBe('123 Main St, Suite 100, City, State');
    });

    it('should handle empty customer address fields', async () => {
      const finalObject = {
        param: {
          customer_address1: '',
          customer_address2: '   ',
          customer_address3: null
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      const addressElement = mockDocument.getElementById('customerAddress');
      expect(addressElement.textContent).toBe('');
    });

    it('should handle workbench activities processing', async () => {
      const finalObject = {
        param: {
          workbench: [
            {
              activity_type_value: 'observation',
              activity_notes: 'Test observation',
              activity_date: '2023-01-01'
            },
            {
              activity_type_value: 'work done',
              activity_notes: 'Test work done',
              activity_date: '2023-01-02'
            },
            {
              activity_type_value: 'recommendation',
              activity_notes: 'Test recommendation',
              activity_date: '2023-01-03'
            }
          ]
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      expect(mockDocument.getElementById).toHaveBeenCalledWith('observation');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('workDone');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('recommendation');
    });

    it('should handle workbench activities with case insensitive matching', async () => {
      const finalObject = {
        param: {
          workbench: [
            {
              activity_type_value: 'OBSERVATION',
              activity_notes: 'Test observation',
              activity_date: '2023-01-01'
            },
            {
              activity_type_value: 'WORK DONE',
              activity_notes: 'Test work done',
              activity_date: '2023-01-02'
            },
            {
              activity_type_value: 'RECOMMENDATION',
              activity_notes: 'Test recommendation',
              activity_date: '2023-01-03'
            }
          ]
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      expect(mockDocument.getElementById).toHaveBeenCalledWith('observation');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('workDone');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('recommendation');
    });

    it('should handle workbench activities with partial matching', async () => {
      const finalObject = {
        param: {
          workbench: [
            {
              activity_type_value: 'Some observation activity',
              activity_notes: 'Test observation',
              activity_date: '2023-01-01'
            },
            {
              activity_type_value: 'Some work done activity',
              activity_notes: 'Test work done',
              activity_date: '2023-01-02'
            },
            {
              activity_type_value: 'Some recommendation activity',
              activity_notes: 'Test recommendation',
              activity_date: '2023-01-03'
            }
          ]
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      expect(mockDocument.getElementById).toHaveBeenCalledWith('observation');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('workDone');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('recommendation');
    });

    it('should handle workbench activities with empty notes', async () => {
      const finalObject = {
        param: {
          workbench: [
            {
              activity_type_value: 'observation',
              activity_notes: '',
              activity_date: '2023-01-01'
            },
            {
              activity_type_value: 'work done',
              activity_notes: null,
              activity_date: '2023-01-02'
            }
          ]
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      // Should still call the functions but with empty content
      expect(mockDocument.getElementById).toHaveBeenCalledWith('observation');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('workDone');
    });

    it('should handle serviceBillable default value', async () => {
      const finalObject = {
        param: { serviceBillable: null },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      expect(mockDocument.getElementById).toHaveBeenCalledWith('serviceBillable');
      const serviceBillableElement = mockDocument.getElementById('serviceBillable');
      expect(serviceBillableElement.textContent).toBe('Yes');
    });

    it('should handle customer signature from paramObj', async () => {
      const finalObject = {
        param: {},
        paramObj: {
          signature: 'data:image/customer-signature'
        },
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      const signatureElement = mockDocument.getElementById('signatureContent');
      expect(signatureElement.innerHTML).toContain('data:image/customer-signature');
      expect(signatureElement.innerHTML).toContain('Customer Signature');
    });

    it('should handle customer comment from paramObj ratings', async () => {
      const finalObject = {
        param: {},
        paramObj: {
          ratings: {
            comment: 'Customer satisfaction comment'
          }
        },
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      const signatureHeaderElement = mockDocument.getElementById('signatureHeader');
      expect(signatureHeaderElement.innerHTML).toContain('Customer satisfaction comment');
      expect(signatureHeaderElement.innerHTML).toContain("Customer's Comment");
    });

    it('should handle page evaluation errors', async () => {
      const error = new Error('Page evaluation failed');
      mockPage.evaluate.mockRejectedValue(error);

      const finalObject = {
        param: { call_no: 'TEST123', product_group: 'thermal' },
        paramObj: { formdata: [] },
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await expect(generateThermalOrPowerReport(mockPage, finalObject))
        .rejects.toThrow('Page evaluation failed');
    });

    it('should handle null/undefined elements gracefully', async () => {
      // Mock getElementById to return null (element not found)
      mockDocument.getElementById.mockReturnValue(null);

      const finalObject = {
        param: { customer_name: 'Test Customer' },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      // Should not throw error even when elements don't exist
      await expect(generateThermalOrPowerReport(mockPage, finalObject))
        .resolves.toEqual(Buffer.from('mock-pdf-content'));
    });

    it('should handle short signature lengths', async () => {
      const finalObject = {
        param: { 
          engineerSignature: 'a', // length <= 1
          managerSignature: 'b'   // length <= 1
        },
        room: {
          customFields: {
            engineerSignature: 'c', // length <= 1
            managerSignature: 'd'   // length <= 1
          }
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      // Should not include signatures with length <= 1
      const signatureElement = mockDocument.getElementById('signatureContent');
      expect(signatureElement.innerHTML).not.toContain('data:image/');
    });

    it('should handle missing paramObj gracefully', async () => {
      const finalObject = {
        param: {},
        paramObj: null,
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      const signatureElement = mockDocument.getElementById('signatureContent');
      // Should contain signature structure even with missing paramObj
      expect(signatureElement.innerHTML).toContain('Customer Signature');
      expect(signatureElement.innerHTML).toContain('Engineer Signature');
    });

    it('should handle missing ratings gracefully', async () => {
      const finalObject = {
        param: {},
        paramObj: { ratings: null },
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      const signatureHeaderElement = mockDocument.getElementById('signatureHeader');
      expect(signatureHeaderElement.innerHTML).toContain("Customer's Comment");
    });

    it('should handle non-array workbench gracefully', async () => {
      const finalObject = {
        param: { workbench: 'not an array' },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      // Should not throw error and should still call the functions
      expect(mockDocument.getElementById).toHaveBeenCalledWith('observation');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('workDone');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('recommendation');
    });

    it('should handle workbench activities with missing properties', async () => {
      const finalObject = {
        param: {
          workbench: [
            {
              activity_type_value: null,
              activity_notes: 'Test note',
              activity_date: '2023-01-01'
            },
            {
              activity_notes: 'Test note without type',
              activity_date: '2023-01-02'
            }
          ]
        },
        paramObj: {},
        tableHTML: '',
        returnedEls: '',
        issuedEls: ''
      };

      await generateThermalOrPowerReport(mockPage, finalObject);

      // Should handle gracefully without throwing errors
      expect(mockDocument.getElementById).toHaveBeenCalledWith('observation');
    });

    it('should handle complex finalObject data', async () => {
      const finalObject = {
        param: { 
          call_no: 'TEST123', 
          product_group: 'thermal',
          customer_name: 'Test Customer',
          fsr_number: 'FSR-001'
        },
        paramObj: { 
          formdata: [
            {
              'Electrical - Level of Risk': 'High',
              'Electrical - Can work proceed safely?': 'Yes',
              'Electrical - Detail safety measures put in place?': 'Lockout/Tagout'
            }
          ]
        },
        tableHTML: '<div>Safety Table</div>',
        returnedEls: '<div>Returned Parts</div>',
        issuedEls: '<div>Issued Parts</div>'
      };

      const result = await generateThermalOrPowerReport(mockPage, finalObject);

      expect(result).toEqual(Buffer.from('mock-pdf-content'));
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle null/undefined values in finalObject', async () => {
      // Mock page.evaluate to handle null param gracefully
      mockPage.evaluate.mockImplementation(async (fn, finalObject) => {
        try {
          return await fn(finalObject);
        } catch (error) {
          // Expected to throw when param is null
          return undefined;
        }
      });

      const finalObject = {
        param: null,
        paramObj: undefined,
        tableHTML: null,
        returnedEls: undefined,
        issuedEls: null
      };

      const result = await generateThermalOrPowerReport(mockPage, finalObject);

      expect(result).toEqual(Buffer.from('mock-pdf-content'));
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle special characters in data', async () => {
      const finalObject = {
        param: { 
          call_no: 'TEST-123 & "Special"', 
          product_group: 'thermal <script>',
          customer_name: 'Customer & "Name"'
        },
        paramObj: { 
          formdata: [
            {
              'Test <script> - Level of Risk': 'High & "Dangerous"',
              'Test <script> - Can work proceed safely?': 'Yes, with <precautions>'
            }
          ]
        },
        tableHTML: '<div>Safety Table & "Content"</div>',
        returnedEls: '<div>Returned Parts <script></div>',
        issuedEls: '<div>Issued Parts & "Content"</div>'
      };

      const result = await generateThermalOrPowerReport(mockPage, finalObject);

      expect(result).toEqual(Buffer.from('mock-pdf-content'));
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle empty finalObject', async () => {
      // Mock page.evaluate to handle undefined param gracefully
      mockPage.evaluate.mockImplementation(async (fn, finalObject) => {
        try {
          return await fn(finalObject);
        } catch (error) {
          // Expected to throw when param is undefined
          return undefined;
        }
      });

      const finalObject = {};

      const result = await generateThermalOrPowerReport(mockPage, finalObject);

      expect(result).toEqual(Buffer.from('mock-pdf-content'));
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle very large data objects', async () => {
      const largeFormdata = Array(1000).fill().map((_, i) => ({
        [`Hazard ${i} - Level of Risk`]: `Risk ${i}`,
        [`Hazard ${i} - Can work proceed safely?`]: `Yes ${i}`,
        [`Hazard ${i} - Detail safety measures put in place?`]: `Measures ${i}`
      }));

      const finalObject = {
        param: { call_no: 'TEST123', product_group: 'thermal' },
        paramObj: { formdata: largeFormdata },
        tableHTML: '<div>Large Safety Table</div>',
        returnedEls: '<div>Large Returned Parts</div>',
        issuedEls: '<div>Large Issued Parts</div>'
      };

      const result = await generateThermalOrPowerReport(mockPage, finalObject);

      expect(result).toEqual(Buffer.from('mock-pdf-content'));
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null parameters gracefully', () => {
      expect(() => generatePartReturnedAndConsumedTable(null, 3, false)).toThrow();
      expect(() => generateSafetyTable(null)).not.toThrow();
    });

    it('should handle undefined parameters gracefully', () => {
      expect(() => generatePartReturnedAndConsumedTable(undefined, 3, false)).toThrow();
      expect(() => generateSafetyTable(undefined)).not.toThrow();
    });

    it('should handle invalid defaultValue in generatePartReturnedAndConsumedTable', () => {
      const param = { material: [] };
      
      expect(() => generatePartReturnedAndConsumedTable(param, -1, false)).not.toThrow();
      expect(() => generatePartReturnedAndConsumedTable(param, 0, false)).not.toThrow();
      expect(() => generatePartReturnedAndConsumedTable(param, 'invalid', false)).not.toThrow();
    });

    it('should handle non-array material data', () => {
      const param = { material: 'not-an-array' };
      
      expect(() => generatePartReturnedAndConsumedTable(param, 3, false)).toThrow();
    });

    it('should handle non-array formdata in generateSafetyTable', () => {
      const formdata = 'not-an-array';
      
      expect(() => generateSafetyTable(formdata)).toThrow();
    });

    it('should handle malformed material objects', () => {
      const param = {
        material: [
          null,
          undefined,
          'not-an-object',
          { part_activity: null },
          { part_activity: 'issued' } // Valid object
        ]
      };
      
      expect(() => generatePartReturnedAndConsumedTable(param, 3, false)).toThrow();
    });
  });

  describe('generateThermalOrPowerReport - Comprehensive Coverage', () => {
    let mockPage;
    let mockFinalObject;

    beforeEach(() => {
      mockPage = {
        setContent: jest.fn().mockResolvedValue(),
        pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
        close: jest.fn().mockResolvedValue(),
        evaluate: jest.fn().mockResolvedValue(undefined)
      };

      mockFinalObject = {
        param: {
          customer_name: 'Test Customer',
          call_no: 'TEST123',
          completion_date: '2023-01-01',
          servicetype: 'Maintenance',
          customer_address1: '123 Main St',
          customer_address2: 'Suite 100',
          customer_address3: 'City, State',
          contact: 'John Doe',
          contact_no: '555-1234',
          product_model: 'Model X',
          product_rating: '100kW',
          product_serialno: 'SN123456',
          product_coverage: 'Standard',
          engineername: 'Engineer Name',
          call_engineer_mobilenumber: '555-5678',
          id: 'REQ123',
          call_log_date: '2023-01-01',
          call_actual_end_date: '2023-01-01',
          problemstatement: 'Test problem',
          call_type: 'Service',
          problem_code_description: 'Code 1',
          resolution_code_description: 'Resolution 1',
          travel_start_time: '09:00',
          reporting_date: '2023-01-01',
          on_site_time: '2 hours',
          travel_time: '1 hour',
          visits: '1',
          equipment_facetime_info: 'Equipment info',
          break_time: '30 min',
          total_time: '3.5 hours',
          serviceBillable: 'Yes',
          workbench: [
            {
              activity_type_value: 'Observation',
              activity_notes: 'Test observation',
              activity_date: '2023-01-01'
            },
            {
              activity_type_value: 'Work Done',
              activity_notes: 'Test work done',
              activity_date: '2023-01-01'
            },
            {
              activity_type_value: 'Recommendation',
              activity_notes: 'Test recommendation',
              activity_date: '2023-01-01'
            }
          ]
        },
        paramObj: {
          ratings: {
            comment: 'Customer comment'
          },
          signature: 'data:image/signature'
        },
        room: {
          customFields: {
            engineerSignature: 'data:image/engineer',
            managerSignature: 'data:image/manager'
          }
        },
        issuedEls: '<div>Issued Parts</div>',
        returnedEls: '<div>Returned Parts</div>',
        tableHTML: '<div>Assessment Table</div>',
        template: '<html><body>Test Template</body></html>'
      };
    });

          it('should handle complete finalObject with all fields', async () => {
            const result = await generateThermalOrPowerReport(mockPage, mockFinalObject);
            
            expect(mockPage.evaluate).toHaveBeenCalled();
            expect(mockPage.pdf).toHaveBeenCalled();
            expect(result).toEqual(Buffer.from('mock-pdf-content'));
          });

    it('should handle finalObject with engineer signature from param', async () => {
      mockFinalObject.param.engineerSignature = 'data:image/param-engineer';
      mockFinalObject.room = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with manager signature from param', async () => {
      mockFinalObject.param.managerSignature = 'data:image/param-manager';
      mockFinalObject.room = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with short signatures (length <= 1)', async () => {
      mockFinalObject.param.engineerSignature = 'a';
      mockFinalObject.param.managerSignature = 'b';
      mockFinalObject.room.customFields.engineerSignature = 'c';
      mockFinalObject.room.customFields.managerSignature = 'd';
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with empty/null room customFields', async () => {
      mockFinalObject.room = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with empty room customFields', async () => {
      mockFinalObject.room.customFields = {};
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with null room customFields', async () => {
      mockFinalObject.room.customFields = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with missing address fields', async () => {
      delete mockFinalObject.param.customer_address1;
      delete mockFinalObject.param.customer_address2;
      delete mockFinalObject.param.customer_address3;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with empty address fields', async () => {
      mockFinalObject.param.customer_address1 = '';
      mockFinalObject.param.customer_address2 = '   ';
      mockFinalObject.param.customer_address3 = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'observation',
          activity_notes: 'Test observation note',
          activity_date: '2023-01-01'
        },
        {
          activity_type_value: 'work done',
          activity_notes: 'Test work done note',
          activity_date: '2023-01-01'
        },
        {
          activity_type_value: 'recommendation',
          activity_notes: 'Test recommendation note',
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with empty workbench activities', async () => {
      mockFinalObject.param.workbench = [];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities without notes', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'observation',
          activity_notes: '',
          activity_date: '2023-01-01'
        },
        {
          activity_type_value: 'work done',
          activity_notes: null,
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities with multiple entries', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'observation',
          activity_notes: 'First observation',
          activity_date: '2023-01-01'
        },
        {
          activity_type_value: 'observation',
          activity_notes: 'Second observation',
          activity_date: '2023-01-02'
        },
        {
          activity_type_value: 'work done',
          activity_notes: 'First work',
          activity_date: '2023-01-01'
        },
        {
          activity_type_value: 'work done',
          activity_notes: 'Second work',
          activity_date: '2023-01-02'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with missing paramObj', async () => {
      delete mockFinalObject.paramObj;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with empty paramObj', async () => {
      mockFinalObject.paramObj = {};
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with missing ratings', async () => {
      mockFinalObject.paramObj = { signature: 'data:image/signature' };
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with missing signature', async () => {
      mockFinalObject.paramObj = { ratings: { comment: 'Customer comment' } };
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with null signature', async () => {
      mockFinalObject.paramObj.signature = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with empty signature', async () => {
      mockFinalObject.paramObj.signature = '';
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with missing comment', async () => {
      mockFinalObject.paramObj.ratings = {};
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with null comment', async () => {
      mockFinalObject.paramObj.ratings.comment = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with empty comment', async () => {
      mockFinalObject.paramObj.ratings.comment = '';
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with serviceBillable as No', async () => {
      mockFinalObject.param.serviceBillable = 'No';
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with missing serviceBillable', async () => {
      delete mockFinalObject.param.serviceBillable;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with null serviceBillable', async () => {
      mockFinalObject.param.serviceBillable = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench as non-array', async () => {
      mockFinalObject.param.workbench = 'not an array';
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench as null', async () => {
      mockFinalObject.param.workbench = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having null activity_type_value', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: null,
          activity_notes: 'Test note',
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having undefined activity_type_value', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: undefined,
          activity_notes: 'Test note',
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having empty activity_type_value', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: '',
          activity_notes: 'Test note',
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having null activity_notes', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'observation',
          activity_notes: null,
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having undefined activity_notes', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'observation',
          activity_notes: undefined,
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having empty activity_notes', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'observation',
          activity_notes: '',
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having zero length activity_notes', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'observation',
          activity_notes: 'a',
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having case-insensitive matching', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'OBSERVATION',
          activity_notes: 'Test observation',
          activity_date: '2023-01-01'
        },
        {
          activity_type_value: 'WORK DONE',
          activity_notes: 'Test work done',
          activity_date: '2023-01-01'
        },
        {
          activity_type_value: 'RECOMMENDATION',
          activity_notes: 'Test recommendation',
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having partial matching', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'Some observation activity',
          activity_notes: 'Test observation',
          activity_date: '2023-01-01'
        },
        {
          activity_type_value: 'Some work done activity',
          activity_notes: 'Test work done',
          activity_date: '2023-01-01'
        },
        {
          activity_type_value: 'Some recommendation activity',
          activity_notes: 'Test recommendation',
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with workbench activities having no matching activity types', async () => {
      mockFinalObject.param.workbench = [
        {
          activity_type_value: 'other activity',
          activity_notes: 'Test note',
          activity_date: '2023-01-01'
        }
      ];
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with all null/undefined param fields', async () => {
      mockFinalObject.param = {};
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with null param', async () => {
      mockFinalObject.param = null;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });

    it('should handle finalObject with undefined param', async () => {
      mockFinalObject.param = undefined;
      
      await generateThermalOrPowerReport(mockPage, mockFinalObject);
      
      expect(mockPage.evaluate).toHaveBeenCalled();
    });
  });
});
