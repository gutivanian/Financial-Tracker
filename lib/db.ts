import { Pool } from 'pg';

// Database configuration
const sslConfig = process.env.DB_SSL === 'true' && process.env.DB_CA_CERT
  ? {
      rejectUnauthorized: true,
      ca: process.env.DB_CA_CERT,
    }
  : false;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'personal_finance',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: sslConfig,
});

// Helper function untuk query
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;