const { s3FSRFileOperations } = require('../helpers/s3Operations');
const logger = require('../utils/logger');
const config = require('../utils/config');

module.exports.handler = async (event) => {
  const userAgent = event.headers?.['user-agent'] || '';
  logger.logRequestStart('report.getpdf', 'GET', event.queryStringParameters, userAgent);
  
  try {
    const params = event.queryStringParameters || {};
    
    if (!params.call_no) {
      const errorResponse = { error: 'call_no parameter is required' };
      logger.logResponse('report.getpdf', errorResponse, userAgent);
      
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(errorResponse)
      };
    }

    let pdfContent = null;

    if (config.isS3Configured()) {
      try {
        pdfContent = await s3FSRFileOperations('read', `${params.call_no.toLowerCase()}.pdf`, '', params.call_no.toLowerCase(), `fsr/${new Date().getFullYear()}`);
        logger.logS3Operation('read', `${params.call_no}.pdf`, 'SUCCESS');
      } catch (s3Error) {
        logger.logS3Operation('read', `${params.call_no}.pdf`, 'FAILED', s3Error.message);
      }
    } else {
      logger.warn('S3 not configured - cannot retrieve PDF');
    }

    if (pdfContent) {
      const successResponse = { 
        message: 'PDF retrieved successfully',
        fileName: `${params.call_no}.pdf`,
        size: pdfContent.length
      };
      logger.logResponse('report.getpdf', successResponse, userAgent);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${params.call_no}.pdf"`,
          'Access-Control-Allow-Origin': '*'
        },
        body: pdfContent.toString('base64'),
        isBase64Encoded: true
      };
    } else {
      const notFoundResponse = { error: 'PDF not found' };
      logger.logResponse('report.getpdf', notFoundResponse, userAgent);
      
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(notFoundResponse)
      };
    }

  } catch (error) {
    logger.error('PDF retrieval failed:', error.message);
    
    const errorResponse = { error: error.message };
    logger.logResponse('report.getpdf', errorResponse, userAgent);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(errorResponse)
    };
  }
};