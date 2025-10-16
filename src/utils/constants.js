// Utility functions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Format date for logging
function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    fractionalSecondDigits: 3, 
    timeZoneName: 'short' 
  }).format(date);
}

// Validate required parameters
function validateRequiredParams(params, requiredFields) {
  const missing = requiredFields.filter(field => !params[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
  return true;
}

// Generate unique filename
function generateFileName(callNo, extension = 'pdf') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${callNo.toLowerCase()}-${timestamp}.${extension}`;
}

// Sanitize string for HTML
function sanitizeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

module.exports = { 
  sleep, 
  isJSON, 
  formatDateTime, 
  validateRequiredParams, 
  generateFileName, 
  sanitizeHtml 
};
