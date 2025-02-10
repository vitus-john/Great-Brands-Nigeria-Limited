const db = require('../services/dbService');

// Add user to waitlist
exports.addToWaitlist = async (req, res) => {
  const { eventId, userId } = req.body;

  try {
    // Check if the user is already on the waitlist
    const [existing] = await db.execute('SELECT * FROM waitlist WHERE event_id = ? AND user_id = ?', [eventId, userId]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User is already on the waitlist' });
    }

    // Add user to waitlist
    await db.execute('INSERT INTO waitlist (event_id, user_id, created_at) VALUES (?, ?, NOW())', [eventId, userId]);
    res.status(200).json({ message: 'Added to waitlist successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add to waitlist' });
  }
};

// Remove user from waitlist
exports.removeFromWaitlist = async (req, res) => {
  const { eventId, userId } = req.body;

  try {
    const [result] = await db.execute('DELETE FROM waitlist WHERE event_id = ? AND user_id = ?', [eventId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found on waitlist' });
    }
    res.status(200).json({ message: 'Removed from waitlist successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to remove from waitlist' });
  }
};

// Get waitlist for an event
exports.getWaitlist = async (req, res) => {
  const { eventId } = req.params;

  try {
    const [waitlist] = await db.execute('SELECT * FROM waitlist WHERE event_id = ?', [eventId]);
    res.status(200).json({ waitlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch waitlist' });
  }
};