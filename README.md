# PDF Generation Serverless Service

A serverless AWS Lambda service for generating Field Service Reports (FSR) in PDF format using Puppeteer and HTML templates.

## Features

- **Multi-format Support**: Generate PDFs for DPG, Thermal/Power, and DCPS product groups
- **S3 Integration**: Automatic PDF storage and retrieval from AWS S3
- **Email Delivery**: Send PDFs via AWS SES with multiple attachment support
- **Template-based**: Uses HTML templates for flexible report formatting
- **Error Handling**: Robust error handling with retry mechanisms
- **CORS Support**: Cross-origin resource sharing enabled

## Prerequisites

- Node.js 18.x or higher
- AWS CLI configured
- Serverless Framework
- AWS Account with appropriate permissions

## Installation

1. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials and configuration
   ```

2. **Deploy**:
   ```bash
   npm run deploy:dev
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AWS_REGION` | AWS region | Yes | us-east-1 |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes | - |
| `S3_BUCKET` | S3 bucket name | Yes | - |
| `FROM_EMAIL` | Sender email address | Yes | - |
| `FSR_REATTEMPT_TIMEOUT` | Retry timeout (ms) | No | 5000 |
| `PRESIGNED_URL_EXPIRE` | URL expiration (s) | No | 3600 |

## API Endpoints

### Generate PDF

**POST** `/notification/report`

**Request Body**:
```json
{
  "call_no": "CALL-001",
  "product_group": "dpg",
  "customer_name": "Customer Name",
  "completion_date": "2024-01-15",
  "MODEL": "DPG-1000",
  "SERIAL_NUMBER": "SN123456",
  "issued_els": [
    {
      "part_number": "PART001",
      "description": "Description",
      "quantity": 2
    }
  ],
  "returned_els": [],
  "to": "recipient@example.com",
  "subject": "FSR Report",
  "text": "Please find attached the report.",
  "dontSentEmail": false
}
```

**Response**:
```json
{
  "success": true,
  "etag": "\"abc123def456\"",
  "fileName": "call-001.pdf",
  "path": "fsr/2024"
}
```

### Retrieve PDF

**GET** `/report/getpdf?call_no=CALL-001`

**Response**: PDF file (binary)

## Product Groups

### DPG (Data Center Power Generation)
- Uses `dpg.html` template
- Includes parts consumed/returned tables
- Safety assessment table

### Thermal/Power
- Uses `thermal.html` template
- Includes workbench activities (observations, work done, recommendations)
- Service type and billing information

### DCPS (Data Center Power System)
- Uses `dcps.html` template
- Site-specific information
- System configuration details

## Development

### Local Development

```bash
# Start local server
npm start

# Test locally
npm run test:local
```

### Testing

```bash
# Run all tests
npm test
```

### Deployment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## Troubleshooting

### Common Issues

1. **Puppeteer timeout**: Increase Lambda timeout in `serverless.yml`
2. **S3 permissions**: Ensure Lambda execution role has S3 access
3. **Email not verified**: Verify sender email in AWS SES console
4. **Template not found**: Ensure HTML templates are copied to `src/templates/`

### Debug Mode

Set `ENABLE_VERTIV_LOGS=true` for detailed logging.

## License

MIT License
