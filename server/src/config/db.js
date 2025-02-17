import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Basic environment variable check
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('Missing required database environment variables');
    process.exit(1);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: process.env.DB_CHARSET || 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Simple connection test
try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
} catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
}

export default pool;