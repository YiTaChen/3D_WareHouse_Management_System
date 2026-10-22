const express = require('express');
const database = require('../models');
const { initializeDatabase } = require('../db/initializeDatabase');

const router = express.Router();

const { requireDbSwitcherAccess } = require('../middleware/security');

const toClientError = () => ({ ok: false, error: 'Database operation failed. Check the server configuration.' });

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
        config: { type: context.dbConfig.type },
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
