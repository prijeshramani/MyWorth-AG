import { Request, Response } from 'express';

export class SwaggerController {
  public static getOpenApiJson(req: Request, res: Response): void {
    res.status(200).json({
      openapi: '3.0.3',
      info: {
        title: 'Family Wealth OS REST API',
        version: '1.0.0',
        description: 'Enterprise-grade local-first wealth platform REST API'
      },
      servers: [
        { url: '/api/v1', description: 'API Version 1 Endpoint Server' }
      ],
      paths: {
        '/portfolio/summary': {
          get: {
            summary: 'API-001 Portfolio Summary',
            description: 'Retrieves consolidated family portfolio summary, net worth rollup, analytics, and risk metrics.',
            parameters: [
              { name: 'familyId', in: 'query', required: true, schema: { type: 'integer' } },
              { name: 'asOfDate', in: 'query', required: false, schema: { type: 'string', format: 'date' } },
              { name: 'reportingCurrency', in: 'query', required: false, schema: { type: 'string', default: 'INR' } },
              { name: 'includeRiskMetrics', in: 'query', required: false, schema: { type: 'boolean', default: false } }
            ],
            responses: {
              '200': { description: 'Successful Portfolio Summary Response' },
              '400': { description: 'Missing or Invalid Query Parameters' },
              '404': { description: 'Family Not Found' }
            }
          }
        },
        '/dashboard/overview': {
          get: {
            summary: 'API-002 Dashboard Overview',
            description: 'Retrieves high-level wealth overview and family member net worth breakdown.',
            parameters: [
              { name: 'familyId', in: 'query', required: true, schema: { type: 'integer' } },
              { name: 'asOfDate', in: 'query', required: false, schema: { type: 'string', format: 'date' } }
            ],
            responses: {
              '200': { description: 'Successful Dashboard Overview Response' },
              '400': { description: 'Missing familyId' }
            }
          }
        },
        '/reports/generate': {
          post: {
            summary: 'API-003 Report Generation',
            description: 'Triggers wealth report generation in PDF or CSV format.',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['familyId', 'reportType', 'format'],
                    properties: {
                      familyId: { type: 'integer' },
                      reportType: { type: 'string', enum: ['PORTFOLIO_SUMMARY', 'TAX_STATEMENT', 'HOLDINGS_LEDGER'] },
                      format: { type: 'string', enum: ['PDF', 'CSV', 'JSON'] }
                    }
                  }
                }
              }
            },
            responses: {
              '200': { description: 'Report successfully generated' },
              '400': { description: 'Invalid request body payload' }
            }
          }
        }
      }
    });
  }

  public static getSwaggerUiHtml(req: Request, res: Response): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Family Wealth OS — Interactive Developer Portal & API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; font-family: sans-serif; }
    .topbar { background-color: #0f172a; padding: 12px 20px; color: white; display: flex; align-items: center; justify-content: space-between; }
    .topbar h1 { margin: 0; font-size: 18px; font-weight: 600; }
    .topbar span { background: #0284c7; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="topbar">
    <h1>Family Wealth OS — Developer Portal</h1>
    <span>Backend Platform v1.0 • REST API Docs</span>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api-docs/swagger.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  }
}
