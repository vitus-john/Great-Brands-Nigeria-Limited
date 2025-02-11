const mysql = require("mysql2/promise");
const { createClient } = require("redis");
require("dotenv").config();

// MySQL Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.NODE_ENV === "test" ? process.env.DB_NAME_TEST : process.env.DB_NAME,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds timeout
});

// Handle MySQL Connection Errors
db.getConnection()
  .then((connection) => {
    console.log("✅ MySQL Database Connected");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ MySQL Connection Error:", err);
    process.exit(1); // Exit if DB connection fails
  });

// Function to Execute MySQL Queries
async function queryDatabase(sql, params = []) {
  let connection;
  try {
    connection = await db.getConnection();

    if (!connection) {
      throw new Error("Database connection failed");
    }

    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error("❌ MySQL Query Error:", error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release(); // Always release the connection
    }
  }
}


// Redis Connection
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

async function connectRedis() {
  try {
    await redisClient.connect();
    console.log("✅ Redis connected successfully");
  } catch (err) {
    console.error("❌ Redis Connection Error:", err);
    process.exit(1);
  }
}

// Handle Redis errors
redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

connectRedis();

module.exports = { db, queryDatabase, redisClient };
