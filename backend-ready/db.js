const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  console.log('[DATABASE] Connecting using DATABASE_URL...');
  pool = mysql.createPool(process.env.DATABASE_URL);
} else if (process.env.DB_HOST) {
  console.log(`[DATABASE] Connecting using DB_HOST: ${process.env.DB_HOST}`);
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'e_attend_db',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
  });
} else {
  console.warn('[DATABASE WARNING] Neither DATABASE_URL nor DB_HOST are set. Defaulting to localhost:3306');
  pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'e_attend_db',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

// Prevent pool from crashing the Node process on unhandled connection/query errors
pool.on('error', (err) => {
  console.error('[DATABASE POOL ERROR]', err);
});

module.exports = pool;
