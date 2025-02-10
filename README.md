# Event Booking API

This is a Node.js-based Event Booking API that includes authentication, event management, booking, and payment processing. It uses Redis for session storage, MySQL as the database, and middleware for authentication and logging.

## Features Implemented

- **User Authentication**: Login and signup endpoints
- **Event Management**: Create, read, update, and delete events
- **Booking System**: Users can book events
- **Payment Processing**: Integration with Paystack
- **Session Management**: Uses Redis for session storage
- **Security**: JWT-based authentication with token verification
- **Cron Jobs**: Auto-expiring events past their date

## Technologies Used

- **Node.js** + Express.js
- **MySQL** (with `mysql2` package)
- **Redis** (for session storage)
- **Express-session** + `connect-redis`
- **JWT Authentication**
- **Paystack API** (for payments)
- **Morgan** (for logging)
- **Node-cron** (for scheduling tasks)

## Recent Fixes & Improvements

- **Fixed Redis Connection Issues**: Ensured Redis connects before usage
- **Fixed Import Issues**: `connect-redis` import now uses `.default`
- **Improved Session Handling**: Only uses Redis store if it's successfully connected
- **Refactored Middleware**: `verifyToken` is now applied only where needed, not globally
- **Database Query Fixes**: Updated event status properly via cron job

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Events
- `GET /api/events` - Fetch all events
- `POST /api/events` - Create a new event *(requires authentication)*
- `PUT /api/events/:id` - Update an event *(requires authentication)*
- `DELETE /api/events/:id` - Delete an event *(requires authentication)*

### Bookings
- `POST /api/bookings` - Book an event *(requires authentication)*
- `GET /api/bookings` - Fetch user bookings *(requires authentication)*

### Payments
- `POST /api/payments` - Process payment *(requires authentication)*

## Setup Instructions

1. Clone this repository:
   ```sh
   git clone https://github.com/your-username/event-booking-api.git
   cd event-booking-api
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Setup `.env` file with:
   ```env
   PORT=5000
   SESSION_SECRET=your-secret-key
   REDIS_HOST=localhost
   REDIS_PORT=6379
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=your-db-name
   PAYSTACK_SECRET_KEY=your-paystack-secret-key
   ```
4. Run the server:
   ```sh
   npm start
   ```

## Testing & Coverage
- **Unit Testing**: Implemented tests for authentication and event management
- **Coverage Summary**: Test results indicate uncovered lines mainly in error handling

## Next Steps
- Improve test coverage for payments & cron jobs
- Add email notifications for bookings
- Enhance rate limiting for security

## Contributing
Feel free to submit issues or pull requests. Fork the repo and submit PRs for review!

---
### Author
**Vitus John Oguike** - Founder of Vitjohn Technology.

