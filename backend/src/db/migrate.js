import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = await fs.readFile(schemaPath, 'utf8');
    console.log('Running database migrations...');
    await pool.query(sql);
    console.log('Database migrations completed successfully.');
    return true;
  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
