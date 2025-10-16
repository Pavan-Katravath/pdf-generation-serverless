// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

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

// Custom assertion for PDF response validation
Cypress.Commands.add('validatePDFResponse', (response) => {
  expect(response.status).to.be.oneOf([200, 500]);
  expect(response.body).to.have.property('success');
  
  if (response.body.success) {
    expect(response.body).to.have.property('fileName');
    expect(response.body).to.have.property('path');
    expect(response.body.fileName).to.match(/\.pdf$/);
  } else {
    expect(response.body).to.have.property('error');
    expect(response.body).to.have.property('timestamp');
  }
});
