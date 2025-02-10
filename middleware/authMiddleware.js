const jwt = require("jsonwebtoken");
const { db, redisClient } = require("../config/db");


const verifyToken = async (req, res, next) => {
  console.log("Request headers:", req.headers); // Debugging
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log("Token received:", token); // Debugging
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) return res.status(401).json({ message: "Session expired. Please log in again." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const sessionExists = await redisClient.get(`user:${decoded.id}:status`);
    if (!sessionExists) return res.status(401).json({ message: "Session expired. Please log in again." });

    await redisClient.setEx(`user:${decoded.id}:status`, 900, "online");

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const verifyRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access forbidden: Insufficient permissions" });
    }
    next();
  };
};



const isOrganizer = async (req, res, next) => {
  const { userId } = req.body; // Assuming userId is passed in the request

  try {
    const [user] = await db.execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (!user.length || user[0].role !== 'organizer') {
      return res.status(403).json({ message: 'Access denied. Only organizers can perform this action' });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify user role' });
  }
};

module.exports = { verifyToken, verifyRole, isOrganizer };
