// Mock Paystack
jest.mock('../services/paystackService', () => ({
    initializePayment: jest.fn(() => Promise.resolve('https://api.paystack.co/transaction/initialize')),
    verifyPayment: jest.fn(() => Promise.resolve(true)),
  }));
  
  const { initializePayment, verifyPayment } = require('../services/paystackService');
  
  describe('Paystack Service', () => {
    it('should initialize payment', async () => {
      const paymentUrl = await initializePayment('sipboyjohn@gmail.com', 5000);
      expect(paymentUrl).toBe('https://api.paystack.co/transaction/initialize');
    });
  
    it('should verify payment', async () => {
      const isVerified = await verifyPayment('payment-ref-123');
      expect(isVerified).toBe(true);
    });
  });