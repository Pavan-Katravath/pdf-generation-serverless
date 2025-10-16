describe('API Health Check', () => {
  it('should verify serverless-offline is running', () => {
    cy.request({
      method: 'POST',
      url: '/notification.report',
      body: { test: 'health-check' },
      failOnStatusCode: false,
    }).then((response) => {
      // Server is running if we get any response (even error)
      expect(response.status).to.be.oneOf([200, 400, 500]);
      expect(response.body).to.have.property('success');
    });
  });

  it('should verify endpoints are accessible', () => {
    // Test POST endpoint
    cy.request({
      method: 'POST',
      url: '/notification.report',
      body: { test: 'connectivity' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 500]);
    });

    // Test GET endpoint
    cy.request({
      method: 'GET',
      url: '/report.getpdf',
      qs: { file_name: 'test.pdf', path: 'test' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400, 404, 500]);
    });
  });

  it('should verify CORS headers are present', () => {
    cy.request({
      method: 'POST',
      url: '/notification.report',
      body: { test: 'cors-check' },
      failOnStatusCode: false,
    }).then((response) => {
      // Check for CORS headers (may vary by serverless-offline version)
      expect(response.headers).to.have.property('access-control-allow-headers');
      expect(response.headers).to.have.property('access-control-allow-methods');
      
      // Log all headers for debugging
      cy.log('Response headers:', JSON.stringify(response.headers, null, 2));
      
      // Check if any CORS-related header is present
      const corsHeaders = Object.keys(response.headers).filter(key => 
        key.toLowerCase().includes('access-control')
      );
      expect(corsHeaders.length).to.be.greaterThan(0);
    });
  });
});
