const mysql = require('mysql2/promise'); // Use promise-based MySQL2
const { createClient } = require('redis'); // Use named import for Redis v4.x
require('dotenv').config();

// MySQL Connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.NODE_ENV === 'test' ? process.env.DB_NAME_TEST : process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to check MySQL connection
async function checkMySQLConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL Connected Successfully!');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    process.exit(1); // Exit if DB connection fails
  }
}

checkMySQLConnection(); // Call the function to check MySQL connection

// Redis Connection
const redisClient = createClient({
  socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
  }
});

async function connectRedis() {
  try {
      await redisClient.connect(); // IMPORTANT: Always call connect()
      console.log('✅ Redis connected successfully');
  } catch (err) {
      console.error('❌ Redis Connection Error:', err);
      process.exit(1); // Exit the app if Redis fails to connect
  }
}

connectRedis(); // Call Redis connection function

module.exports = { db, redisClient };
