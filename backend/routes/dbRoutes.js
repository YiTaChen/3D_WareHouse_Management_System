const express = require('express');
const database = require('../models');
const { initializeDatabase } = require('../db/initializeDatabase');

const router = express.Router();

const isLocalRequest = (req) => {
  const host = (req.headers.host || '').split(':')[0];
  const remoteAddress = req.socket.remoteAddress || '';

  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    remoteAddress === '127.0.0.1' ||
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1'
  );
};

const requireDbSwitcherAccess = (req, res, next) => {
  if (process.env.ENABLE_DB_SWITCHER === 'true' || isLocalRequest(req)) {
    return next();
  }

  return res.status(403).json({
    error: 'DB switcher is disabled for this server. Enable it with ENABLE_DB_SWITCHER=true only in a trusted environment.',
  });
};

const toClientError = (error) => {
  const reason =
    error?.parent?.message ||
    error?.original?.message ||
    error?.message ||
    error?.parent?.code ||
    error?.original?.code ||
    error?.code ||
    'Unknown database error';

  return {
    ok: false,
    error: reason,
  };
};

router.use(requireDbSwitcherAccess);

router.get('/status', (req, res) => {
  res.json({
    ok: true,
    database: database.getDatabaseStatus(),
  });
});

router.post('/test', async (req, res) => {
  let context;

  try {
    context = database.createDatabaseContextFromRequest(req.body);
    await context.sequelize.authenticate();

    res.json({
      ok: true,
      database: {
        dialect: context.sequelize.getDialect(),
        config: context.dbConfig,
      },
    });
  } catch (error) {
    res.status(400).json(toClientError(error));
  } finally {
    if (context) {
      await context.sequelize.close().catch(() => {});
    }
  }
});

router.post('/switch', async (req, res) => {
  let context;

  try {
    context = database.createDatabaseContextFromRequest(req.body);

    await context.sequelize.authenticate();
    await initializeDatabase(context);
    await database.setActiveDatabaseContext(context);

    res.json({
      ok: true,
      database: database.getDatabaseStatus(),
    });
  } catch (error) {
    if (context) {
      await context.sequelize.close().catch(() => {});
    }

    res.status(400).json(toClientError(error));
  }
});

module.exports = router;
