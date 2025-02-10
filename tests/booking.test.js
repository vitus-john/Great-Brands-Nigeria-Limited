// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(true),
    quit: jest.fn().mockResolvedValue(true),
    get: jest.fn((key) => {
      if (key.startsWith("blacklist")) return Promise.resolve(null);
      if (key.startsWith("user:")) return Promise.resolve("online");
      return Promise.resolve(null);
    }),
    setEx: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock Paystack
jest.mock('../services/paystackService', () => ({
  initializePayment: jest.fn(() => Promise.resolve('https://api.paystack.co/transaction/initialize')),
  verifyPayment: jest.fn(() => Promise.resolve(true)),
}));

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, server } = require('../app'); // Ensure app and server are exported
const { db, redisClient } = require('../config/db');

describe('Ticket Controller', () => {
  let eventId;
  let userId;
  let token;

  beforeAll(async () => {
    try {
      // Seed test data
      const [event] = await db.execute(
        'INSERT INTO events (name, date, description, location, organizers, price, image, total_tickets, available_tickets, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        ['Test Event', '2023-12-31', 'Test Description', 'Test Location', 'Test Organizers', 5000, 'test.jpg', 100, 100]
      );
      eventId = event.insertId;

      const [user] = await db.execute(
        'INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        ['Test User', 'sipboyjohn@gmail.com', 'password', 'user']
      );
      userId = user.insertId;

      token = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      

      await redisClient.connect();
    } catch (error) {
      console.error("Error during setup:", error);
    }
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM tickets');
    await db.execute('DELETE FROM waitlist');
    await db.execute('DELETE FROM events');
    await db.execute('DELETE FROM users');

    // Close Redis connection
    await redisClient.quit();

    // Close MySQL connection pool
    await db.end();

    // Close the server
    server.close();
  });

  it('should book a ticket', async () => {
    const response = await request(app)
      .post('/api/bookings/book')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId, userId, paymentReference: 'payment-ref-123' });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Ticket booked successfully');
  });

  it('should fail to book a ticket if already booked', async () => {
    await request(app)
      .post('/api/bookings/book')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId, userId, paymentReference: 'payment-ref-123' });

    const response = await request(app)
      .post('/api/bookings/book')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventId, userId, paymentReference: 'payment-ref-123' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('User already has a ticket for this event');
  });

  it('should cancel a ticket', async () => {
    const [ticket] = await db.execute(
      'INSERT INTO tickets (event_id, user_id, status, payment_reference, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [eventId, userId, 'booked', 'payment-ref-123']
    );
    const ticketId = ticket.insertId;

    const response = await request(app)
      .post('/api/bookings/cancel')
      .set('Authorization', `Bearer ${token}`)
      .send({ ticketId });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Ticket cancelled successfully');
  });
});
