import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'qrmenu_pro',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10'),
  charset: 'utf8mb4',
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
});

export default pool;
