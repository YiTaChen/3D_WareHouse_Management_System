const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const storage = path.resolve(__dirname, '..', process.env.SQLITE_STORAGE || 'data/warehouse.sqlite');
const sqliteFiles = [storage, `${storage}-shm`, `${storage}-wal`];

for (const file of sqliteFiles) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`Deleted ${file}`);
  }
}

console.log('Demo SQLite database reset complete');
