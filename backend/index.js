const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db/initializeDatabase');
const { requireWriteAccess, corsOptions, securityHeaders, createRequestBudget, sanitizeJsonErrors } = require('./middleware/security');
const { validateRequest } = require('./middleware/validation');

const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.set('query parser', 'simple');
  app.use(securityHeaders, cors(corsOptions()), sanitizeJsonErrors);
  // Reject anonymous writes before parsing/decompressing their bodies.
  app.use(requireWriteAccess, createRequestBudget());
  app.use(express.json({ limit: '16kb', strict: true, inflate: false }));
  app.use(validateRequest);
  app.use('/boxes', require('./routes/boxesRoutes'));
  app.use('/items', require('./routes/itemsRoutes'));
  app.use('/boxPositions', require('./routes/boxPositionRoutes'));
  app.use('/boxContents', require('./routes/boxContentRoutes'));
  app.use('/boxInventory', require('./routes/boxInventoryRoutes'));
  app.use('/db', require('./routes/dbRoutes'));
  app.get('/', (_req, res) => res.send('Server is working!'));
  app.get('/health', (_req, res) => res.json({ status: 'ok', api: 'read-only-public', securityRevision: '2026-10-21' }));
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
    if (error.type === 'encoding.unsupported') return res.status(415).json({ error: 'Compressed request bodies are not supported.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    console.error('API request failed:', error.name);
    return res.status(500).json({ error: 'The request could not be completed.' });
  });
  return app;
};

if (require.main === module) {
  initializeDatabase().then(() => {
    const server = createApp().listen(process.env.PORT || process.env.PORT_LOCAL || 3002, () => {
      console.log(`Warehouse API started with Node ${process.version}`);
    });
    server.requestTimeout = 15000;
    server.headersTimeout = 10000;
    server.keepAliveTimeout = 5000;
  }).catch(error => { console.error('Database initialization failed:', error.name); process.exitCode = 1; });
}
module.exports = { createApp };
