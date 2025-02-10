const db = require('../config/db');

// Initialize an event
const initializeEvent = async (req, res) => {
  const { name, date, description, location, organizers, price, image, total_tickets } = req.body;

  const query = `
    INSERT INTO events (name, date, description, location, organizers, price, image, total_tickets, available_tickets, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  try {
    const [result] = await db.execute(query, [name, date, description, location, organizers, price, image, total_tickets, total_tickets]);
    res.status(201).json({ message: 'Event created successfully', eventId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create event' });
  }
};

// Update event details
const updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const { name, date, description, location, organizers, price, image, total_tickets } = req.body;

  const query = `
    UPDATE events
    SET name = ?, date = ?, description = ?, location = ?, organizers = ?, price = ?, image = ?, total_tickets = ?, updated_at = NOW()
    WHERE id = ?
  `;

  try {
    const [result] = await db.execute(query, [name, date, description, location, organizers, price, image, total_tickets, eventId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update event' });
  }
};

// Delete an event
const deleteEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM events WHERE id = ?', [eventId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};

// Cancel an event (mark as cancelled)
const cancelEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    const [result] = await db.execute('UPDATE events SET status = "cancelled" WHERE id = ?', [eventId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(200).json({ message: 'Event cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to cancel event' });
  }
};

// Get event status
const getEventStatus = async (req, res) => {
  const { eventId } = req.params;

  try {
    const [event] = await db.execute('SELECT name, available_tickets, status FROM events WHERE id = ?', [eventId]);
    const [waitlist] = await db.execute('SELECT COUNT(*) as waitlistCount FROM waitlist WHERE event_id = ?', [eventId]);

    if (!event.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({
      name: event[0].name,
      availableTickets: event[0].available_tickets,
      status: event[0].status,
      waitlistCount: waitlist[0].waitlistCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch event status' });
  }
};

module.exports = {
  initializeEvent,
  updateEvent,
  deleteEvent,
  cancelEvent,
  getEventStatus,
};