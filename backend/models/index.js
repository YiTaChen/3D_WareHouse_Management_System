const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BACKEND_ROOT = path.resolve(__dirname, '..');

const envOrDefault = (name, fallback) =>
    process.env[name] !== undefined ? process.env[name] : fallback;

const requireValue = (value, name) => {
    if (value === undefined || value === null || value === '') {
        throw new Error(`Missing required database setting: ${name}`);
    }

    return value;
};

const requireEnv = (name) => requireValue(process.env[name], name);

const parsePort = (value, fallback) => {
    const port = Number(value || fallback);

    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`Invalid database port: ${value}`);
    }

    return port;
};

const maskSecret = (value) => value ? '********' : '';

const getPostgresDialectOptions = (useSsl) => {
    if (useSsl) {
        return {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        };
    }

    return {};
};

const getSqliteStoragePath = (sqliteStorage) => {
    const storage = sqliteStorage || 'data/warehouse.sqlite';
    return path.isAbsolute(storage)
        ? storage
        : path.resolve(BACKEND_ROOT, storage);
};

const createSequelizeFromUrl = (databaseUrl) => (
    new Sequelize(databaseUrl, {
        logging: false,
        dialectOptions: getPostgresDialectOptions(process.env.PG_SSL === 'true'),
    })
);

const createPostgresSequelize = (config) => (
    new Sequelize(
        config.database,
        config.username,
        config.password,
        {
            host: config.host,
            port: config.port,
            logging: false,
            dialect: 'postgres',
            dialectOptions: getPostgresDialectOptions(config.ssl),
        }
    )
);

const createSqliteSequelize = (sqliteStorage) => {
    const storage = getSqliteStoragePath(sqliteStorage);
    fs.mkdirSync(path.dirname(storage), { recursive: true });

    return new Sequelize({
        dialect: 'sqlite',
        storage,
        logging: false,
    });
};

const defineModels = (sequelize) => {
    const Test1 = require('./test1')(sequelize);
    const Box = require('./Box')(sequelize);
    const Item = require('./Item')(sequelize);
    const BoxPosition = require('./BoxPosition')(sequelize);
    const BoxContent = require('./BoxContent')(sequelize);

    Box.hasOne(BoxPosition, { foreignKey: 'box_id', onDelete: 'CASCADE' });
    BoxPosition.belongsTo(Box, { foreignKey: 'box_id' });

    Box.hasMany(BoxContent, { foreignKey: 'box_id', onDelete: 'CASCADE' });
    BoxContent.belongsTo(Box, { foreignKey: 'box_id' });

    Item.hasMany(BoxContent, { foreignKey: 'item_id', onDelete: 'CASCADE' });
    BoxContent.belongsTo(Item, { foreignKey: 'item_id' });

    return {
        sequelize,
        Test1,
        Box,
        Item,
        BoxPosition,
        BoxContent,
    };
};

const createContext = (sequelize, config) => ({
    ...defineModels(sequelize),
    dbConfig: config,
});

const normalizePostgresConfig = (input, type) => ({
    type,
    host: requireValue(input.host, 'host'),
    port: parsePort(input.port, 5432),
    database: requireValue(input.database, 'database'),
    username: requireValue(input.username || input.user, 'username'),
    password: requireValue(input.password, 'password'),
    ssl: Boolean(input.ssl),
});

const normalizeDatabaseRequest = (input = {}) => {
    const type = input.type || input.dbType || 'sqlite';

    if (type === 'sqlite' || type === 'local_sqlite' || type === 'demo') {
        return {
            type: 'sqlite',
            storage: input.storage || input.sqliteStorage || 'data/warehouse.sqlite',
        };
    }

    if (type === 'local_postgres') {
        return normalizePostgresConfig(input, 'local_postgres');
    }

    if (type === 'cloud_postgres') {
        return normalizePostgresConfig(input, 'cloud_postgres');
    }

    throw new Error(`Unsupported database type: ${type}`);
};

const createDatabaseContextFromConfig = (config) => {
    if (config.type === 'sqlite') {
        return createContext(
            createSqliteSequelize(config.storage),
            {
                type: 'sqlite',
                storage: getSqliteStoragePath(config.storage),
            }
        );
    }

    if (config.type === 'local_postgres' || config.type === 'cloud_postgres') {
        return createContext(
            createPostgresSequelize(config),
            {
                ...config,
                password: maskSecret(config.password),
            }
        );
    }

    throw new Error(`Unsupported database type: ${config.type}`);
};

const createDatabaseContextFromRequest = (input) =>
    createDatabaseContextFromConfig(normalizeDatabaseRequest(input));

const createDatabaseContextFromEnv = () => {
    const dbEnv = process.env.DB_ENV ? process.env.DB_ENV.toLowerCase() : '';
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
        return createContext(
            createSequelizeFromUrl(databaseUrl),
            {
                type: 'database_url',
                url: 'DATABASE_URL',
            }
        );
    }

    if (dbEnv === 'local') {
        const config = {
            type: 'local_postgres',
            host: envOrDefault('PG_HOST_LOCAL', 'localhost'),
            port: parsePort(envOrDefault('PG_PORT_LOCAL', 5432), 5432),
            database: envOrDefault('PG_DATABASE_LOCAL', 'warehouse_dev'),
            username: envOrDefault('PG_USER_LOCAL', 'postgres'),
            password: envOrDefault('PG_PASSWORD_LOCAL', 'postgres'),
            ssl: false,
        };

        return createDatabaseContextFromConfig(config);
    }

    if (dbEnv === 'cloud') {
        const config = {
            type: 'cloud_postgres',
            host: requireEnv('PG_HOST'),
            port: parsePort(envOrDefault('PG_PORT', 5432), 5432),
            database: requireEnv('PG_DATABASE'),
            username: requireEnv('PG_USER'),
            password: requireEnv('PG_PASSWORD'),
            ssl: process.env.PG_SSL === 'true',
        };

        return createDatabaseContextFromConfig(config);
    }

    if (dbEnv && dbEnv !== 'sqlite' && dbEnv !== 'demo') {
        throw new Error(`Unsupported DB_ENV "${dbEnv}". Use "local", "cloud", "sqlite", or "demo".`);
    }

    return createDatabaseContextFromConfig({
        type: 'sqlite',
        storage: process.env.SQLITE_STORAGE || 'data/warehouse.sqlite',
    });
};

let activeContext = createDatabaseContextFromEnv();

const getModels = () => activeContext;

const getDatabaseStatus = () => ({
    dialect: activeContext.sequelize.getDialect(),
    config: activeContext.dbConfig,
});

const setActiveDatabaseContext = async (nextContext) => {
    const previousContext = activeContext;
    activeContext = nextContext;

    if (previousContext && previousContext.sequelize !== nextContext.sequelize) {
        await previousContext.sequelize.close().catch((error) => {
            console.warn('Failed to close previous database connection:', error.message);
        });
    }
};

module.exports = {
    get sequelize() {
        return activeContext.sequelize;
    },
    get Test1() {
        return activeContext.Test1;
    },
    get Box() {
        return activeContext.Box;
    },
    get Item() {
        return activeContext.Item;
    },
    get BoxPosition() {
        return activeContext.BoxPosition;
    },
    get BoxContent() {
        return activeContext.BoxContent;
    },
    getModels,
    getDatabaseStatus,
    normalizeDatabaseRequest,
    createDatabaseContextFromRequest,
    setActiveDatabaseContext,
};
