import http from 'http';
import logger from '../utils/logger.js';
import { runMonitor } from '../agent/runner.js';

function isJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function startHealthServer(port: number = 4000): void {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    if (req.url === '/trigger' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          // Run monitor
          await runMonitor();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            triggered: true,
            message: 'Monitoring run completed or scheduled',
          }));
        } catch (error: any) {
          logger.error('Trigger failed:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            triggered: false,
            error: error.message || 'Failed to start monitoring',
          }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    logger.info(`Health server listening on port ${port}`);
  });

  process.on('SIGTERM', () => {
    server.close();
  });
}
