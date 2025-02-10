const redisClient = require("../config/redis");

const sessionCleanup = async () => {
  try {
    const keys = await redisClient.keys("user:*:status");
    for (const key of keys) {
      const userId = key.split(":")[1];
      const session = await redisClient.get(key);
      if (!session) {
        console.log(`User ${userId} session expired.`);
        await redisClient.del(`refreshToken:${userId}`);
      }
    }
  } catch (error) {
    console.error("Error cleaning up sessions:", error);
  }
};

// Run cleanup every 10 minutes
setInterval(sessionCleanup, 10 * 60 * 1000);
