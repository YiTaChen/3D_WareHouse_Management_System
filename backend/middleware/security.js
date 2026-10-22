const { timingSafeEqual } = require('node:crypto');

const isProduction = (env = process.env) => env.NODE_ENV === 'production' || env.RENDER === 'true' || Boolean(env.RENDER_SERVICE_ID);
const isLoopback = (address) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address);
const isDirectLoopback = (req) => isLoopback(req.socket.remoteAddress)
  && !['forwarded', 'x-forwarded-for', 'x-forwarded-host', 'x-real-ip'].some(name => req.headers[name]);
const hasAdminToken = (req, env = process.env) => {
  const secret = env.WAREHOUSE_ADMIN_TOKEN;
  if (typeof secret !== 'string' || secret.length < 32) return false;
  const provided = req.headers.authorization;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(typeof provided === 'string' ? provided : '');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
const requireWriteAccess = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || hasAdminToken(req)) return next();
  return res.status(403).json({ error: 'This public API is read-only. Use the isolated browser demo.' });
};
const requireDbSwitcherAccess = (req, res, next) => {
  // Cloud proxies may connect from loopback. Never infer permission from Host or a proxy IP.
  if (!isProduction() && process.env.ENABLE_DB_SWITCHER === 'true'
      && isDirectLoopback(req) && hasAdminToken(req)) return next();
  return res.status(403).json({ error: 'Database administration is disabled.' });
};
const defaultOrigins = ['https://r3f-gravity-apply-test.firebaseapp.com', 'https://r3f-gravity-apply-test.web.app'];
const corsOptions = () => ({
  origin(origin, callback) {
    const allowed = [...defaultOrigins];
    if (!isProduction()) allowed.push('http://localhost:5173', 'http://127.0.0.1:5173');
    callback(null, !origin || allowed.includes(origin));
  },
  methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
});
const securityHeaders = (_req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Cache-Control': 'no-store' });
  next();
};
// A fixed-memory budget bounds authenticated mutations without proxy/IP assumptions.
const createRequestBudget = ({ limit = 1200, windowMs = 60000, now = Date.now } = {}) => {
  let started = now();
  let count = 0;
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const current = now();
    if (current - started >= windowMs) { started = current; count = 0; }
    if (++count > limit) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((started + windowMs - current) / 1000))));
      return res.status(429).json({ error: 'Too many requests. Please retry shortly.' });
    }
    next();
  };
};
const sanitizeJsonErrors = (_req, res, next) => {
  const send = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 500) return send({ error: 'The request could not be completed.' });
    return send(body);
  };
  next();
};
module.exports = { isProduction, isDirectLoopback, hasAdminToken, requireWriteAccess,
  requireDbSwitcherAccess, corsOptions, securityHeaders, createRequestBudget, sanitizeJsonErrors };
