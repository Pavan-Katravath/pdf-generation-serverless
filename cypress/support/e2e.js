// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Custom commands for PDF generation testing
Cypress.Commands.add('generatePDF', (payload) => {
  return cy.request({
    method: 'POST',
    url: '/notification.report',
    body: payload,
    headers: {
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('getPDF', (fileName, path) => {
  return cy.request({
    method: 'GET',
    url: '/report.getpdf',
    qs: {
      file_name: fileName,
      path: path,
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('waitForServerlessOffline', () => {
  cy.request({
    method: 'POST',
    url: '/notification.report',
    body: { test: 'health-check' },
    failOnStatusCode: false,
  }).then((response) => {
    // If we get any response (even error), server is running
    if (response.status >= 400 && response.status < 600) {
      cy.log('Serverless-offline is ready!');
    } else {
      cy.log('Waiting for serverless-offline to start...');
      cy.wait(2000);
      cy.waitForServerlessOffline();
    }
  });
});
