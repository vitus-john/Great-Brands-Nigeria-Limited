const { db } = require('../config/db');
const { initializePayment, verifyPayment } = require('../services/paystackService');

// Book a ticket
exports.bookTicket = async (req, res) => {
    const { eventId, paymentReference } = req.body;
    const { user } = req; // Get logged-in user details from authController
  
    const connection = await db.getConnection();
    await connection.beginTransaction();
  
    try {
      // Check if the user already has a ticket for this event
      const [existingTicket] = await connection.execute(
        'SELECT * FROM tickets WHERE event_id = ? AND user_id = ?',
        [eventId, user.id]
      );
      if (existingTicket.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'User already has a ticket for this event' });
      }
  
      // Check if the event is active
      const [event] = await connection.execute('SELECT status, available_tickets, price FROM events WHERE id = ? FOR UPDATE', [eventId]);
      if (event[0].status === 'cancelled') {
        await connection.rollback();
        return res.status(400).json({ message: 'Event is cancelled' });
      }
  
      if (event[0].available_tickets <= 0) {
        // Add user to waitlist
        await connection.execute('INSERT INTO waitlist (event_id, user_id, created_at) VALUES (?, ?, NOW())', [eventId, user.id]);
        await connection.commit();
        return res.status(200).json({ message: 'Added to waitlist' });
      }
  
      // Initialize Paystack payment
      const paymentUrl = await initializePayment(user.email, event[0].price * 100); // Convert price to kobo
      if (!paymentUrl) {
        await connection.rollback();
        return res.status(400).json({ message: 'Payment initialization failed' });
      }
  
      // Verify Paystack payment
      const paymentVerified = await verifyPayment(paymentReference);
      if (!paymentVerified) {
        await connection.rollback();
        return res.status(400).json({ message: 'Payment verification failed' });
      }
  
      // Book the ticket
      await connection.execute('INSERT INTO tickets (event_id, user_id, status, payment_reference, created_at, updated_at) VALUES (?, ?, "booked", ?, NOW(), NOW())', [eventId, user.id, paymentReference]);
      await connection.execute('UPDATE events SET available_tickets = available_tickets - 1 WHERE id = ?', [eventId]);
  
      await connection.commit();
      res.status(200).json({ message: 'Ticket booked successfully', paymentUrl });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: 'Failed to book ticket' });
    } finally {
      connection.release();
    }
  };
  
// Cancel a ticket
exports.cancelTicket = async (req, res) => {
  const { ticketId } = req.body;

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // Get ticket details
    const [ticket] = await connection.execute('SELECT event_id, user_id FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const eventId = ticket[0].event_id;
    const userId = ticket[0].user_id;

    // Cancel the ticket
    await connection.execute('UPDATE tickets SET status = "cancelled" WHERE id = ?', [ticketId]);
    await connection.execute('UPDATE events SET available_tickets = available_tickets + 1 WHERE id = ?', [eventId]);

    // Assign ticket to the next user in the waitlist
    const [waitlistUser] = await connection.execute('SELECT user_id FROM waitlist WHERE event_id = ? ORDER BY created_at LIMIT 1', [eventId]);
    if (waitlistUser.length) {
      const nextUserId = waitlistUser[0].user_id;
      await connection.execute('INSERT INTO tickets (event_id, user_id, status, created_at, updated_at) VALUES (?, ?, "booked", NOW(), NOW())', [eventId, nextUserId]);
      await connection.execute('DELETE FROM waitlist WHERE user_id = ? AND event_id = ?', [nextUserId, eventId]);
    }

    await connection.commit();
    res.status(200).json({ message: 'Ticket cancelled successfully' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Failed to cancel ticket' });
  } finally {
    connection.release();
  }
};

// View all booked tickets for a user
exports.viewBookedTickets = async (req, res) => {
  const { userId } = req.params;

  try {
    const [tickets] = await db.execute('SELECT * FROM tickets WHERE user_id = ? AND status = "booked"', [userId]);
    res.status(200).json({ tickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch booked tickets' });
  }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
  const { ticketId } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete booking' });
  }
};