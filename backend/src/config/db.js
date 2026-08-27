import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lecturescribe';

export const pool = new Pool({
  connectionString,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export const query = (text, params) => pool.query(text, params);

export const checkDbConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW() as current_time');
    return { connected: true, timestamp: res.rows[0].current_time };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};
