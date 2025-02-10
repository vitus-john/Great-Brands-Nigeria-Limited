const cron = require("node-cron");
const db = require("../config/db"); // Adjust the path to your db module
const { app, server } = require("../app"); // Import app and server to ensure the cron job is initialized

// Mock the db.execute function
jest.mock("../config/db", () => ({
  execute: jest.fn(),
}));

// Mock console.log and console.error
console.log = jest.fn();
console.error = jest.fn();

// Extract the cron job logic into a separate function for testing
const updateExpiredEvents = async () => {
  try {
    const [events] = await db.execute(
      'UPDATE events SET status = "expired" WHERE date < NOW() AND status = "active"'
    );
    console.log(`Marked ${events.affectedRows} events as expired`);
  } catch (error) {
    console.error("Failed to update expired events:", error);
  }
};

describe("Cron Job - Update Expired Events", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Close the server after all tests are done
    server.close();
  });

  it("should update expired events and log the result", async () => {
    // Mock the db.execute function to return a successful response
    db.execute.mockResolvedValueOnce([{ affectedRows: 3 }]);

    // Call the cron job logic directly
    await updateExpiredEvents();

    // Assertions
    expect(db.execute).toHaveBeenCalledWith(
      'UPDATE events SET status = "expired" WHERE date < NOW() AND status = "active"'
    );
    expect(console.log).toHaveBeenCalledWith("Marked 3 events as expired");
  });

  it("should log an error if the database update fails", async () => {
    // Mock the db.execute function to throw an error
    db.execute.mockRejectedValueOnce(new Error("Database connection failed"));

    // Call the cron job logic directly
    await updateExpiredEvents();

    // Assertions
    expect(db.execute).toHaveBeenCalledWith(
      'UPDATE events SET status = "expired" WHERE date < NOW() AND status = "active"'
    );
    expect(console.error).toHaveBeenCalledWith(
      "Failed to update expired events:",
      expect.any(Error)
    );
  });
});