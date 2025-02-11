const { db } = require('../config/db');

// Create User
const createUser = async (user) => {
  console.log('Creating user:', user); // Log the user data
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO users (name, username, email, password, role, isVerified) VALUES ( ?, ?, ?, ?, ?, ?)";
    db.query(sql, [user.name, user.username, user.email, user.password, user.role, false], (err, results) => {
      if (err) {
        console.error('Error in createUser:', err); // Log any errors
        return reject(err);
      }
      console.log('User created with ID:', results.insertId); // Log the inserted ID
      resolve(results.insertId);
    });
  });
};

// Find User by Email
const findUserByEmail = async (email) => {
  console.log('Finding user by email:', email); // Log the email being searched
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.error('Error in findUserByEmail:', err); // Log any errors
        return reject(err);
      }
      console.log('User search results:', results); // Log the results
      resolve(results[0]);
    });
  });
};


module.exports = { createUser, findUserByEmail };
