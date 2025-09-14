import { LLMCircuitBreaker } from '../src/CircuitBreaker';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Mock axios for testing
const mock = new MockAdapter(axios);

describe('LLMCircuitBreaker', () => {
  afterEach(() => {
    mock.reset();
    jest.useRealTimers();
  });

  it('should make successful calls when circuit is closed', async () => {
    mock.onPost('/test').reply(200, { success: true });
    
    const circuitBreaker = new LLMCircuitBreaker();
    const result = await circuitBreaker.call({
      url: '/test',
      data: { prompt: 'test' }
    });
    
    expect(result).toEqual({ success: true });
  });

  it('should open circuit after multiple failures', async () => {
    mock.onPost('/test').reply(500);
    
    const circuitBreaker = new LLMCircuitBreaker({
      circuitBreaker: { failureThreshold: 2 },
      retry: { maxRetries: 0, initialDelay: 10 } // No retries for faster test
    });
    
    // First failure
    await expect(circuitBreaker.call({ url: '/test' }))
      .rejects
      .toThrow();
    
    // Second failure should open the circuit
    await expect(circuitBreaker.call({ url: '/test' }))
      .rejects
      .toThrow();
    
    // Third call should fail immediately with circuit open error
    await expect(circuitBreaker.call({ url: '/test' }))
      .rejects
      .toThrow('Circuit breaker is open');
  });

  it('should retry on retryable status codes', async () => {
    mock.onPost('/test').replyOnce(429);
    mock.onPost('/test').replyOnce(503);
    mock.onPost('/test').reply(200, { success: true });
    
    const circuitBreaker = new LLMCircuitBreaker({
      retry: { 
        maxRetries: 2, // 2 retries maximum
        initialDelay: 10, // Fast delays for testing
        backoffFactor: 1 // No exponential growth for testing
      }
    });
    
    const result = await circuitBreaker.call({
      url: '/test',
      data: { prompt: 'test' }
    });
    
    expect(result).toEqual({ success: true });
    expect(mock.history.post.length).toBe(3); // Initial + 2 retries
  });
});