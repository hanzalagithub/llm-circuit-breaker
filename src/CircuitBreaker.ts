import { CircuitBreakerConfig, CircuitBreakerState, LLMCallOptions, RetryConfig } from './types';
import { ExponentialBackoff } from './strategies/ExponentialBackoff';
import axios, { AxiosResponse, AxiosError } from 'axios';

const defaultCircuitBreakerConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000,
  successThreshold: 3,
  timeout: 10000,
};

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryOnStatusCodes: [429, 500, 502, 503, 504],
};

export class LLMCircuitBreaker {
  private circuitBreakerConfig: CircuitBreakerConfig;
  private retryConfig: RetryConfig;
  private state: CircuitBreakerState;
  private exponentialBackoff: ExponentialBackoff;

  constructor(options: { circuitBreaker?: Partial<CircuitBreakerConfig>, retry?: Partial<RetryConfig> } = {}) {
    this.circuitBreakerConfig = { ...defaultCircuitBreakerConfig, ...options.circuitBreaker };
    this.retryConfig = { ...defaultRetryConfig, ...options.retry };
    this.exponentialBackoff = new ExponentialBackoff(this.retryConfig);
    
    this.state = {
      status: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailure: null,
      nextAttempt: null,
    };
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  private onSuccess(): void {
    if (this.state.status === 'HALF_OPEN') {
      this.state.successes++;
      if (this.state.successes >= this.circuitBreakerConfig.successThreshold) {
        this.state.status = 'CLOSED';
        this.state.failures = 0;
        this.state.successes = 0;
        this.state.lastFailure = null;
        this.state.nextAttempt = null;
      }
    } else {
      // Reset failures on success when circuit is CLOSED
      this.state.failures = 0;
    }
  }

  private onFailure(error: any): void {
    this.state.failures++;
    this.state.lastFailure = Date.now();
    
    if (this.state.status === 'HALF_OPEN') {
      // Failure in HALF_OPEN state -> go back to OPEN
      this.state.status = 'OPEN';
      this.state.nextAttempt = Date.now() + this.circuitBreakerConfig.resetTimeout;
      this.state.successes = 0;
    } else if (this.state.status === 'CLOSED' && 
               this.state.failures >= this.circuitBreakerConfig.failureThreshold) {
      // Too many failures in CLOSED state -> open the circuit
      this.state.status = 'OPEN';
      this.state.nextAttempt = Date.now() + this.circuitBreakerConfig.resetTimeout;
    }
  }

  private canAttempt(): boolean {
    if (this.state.status === 'CLOSED') return true;
    if (this.state.status === 'HALF_OPEN') return true;
    
    if (this.state.status === 'OPEN') {
      if (this.state.nextAttempt && Date.now() > this.state.nextAttempt) {
        this.state.status = 'HALF_OPEN';
        this.state.nextAttempt = null;
        return true;
      }
    }
    
    return false;
  }

  async call<T>(options: LLMCallOptions): Promise<T> {
    if (!this.canAttempt()) {
      throw new Error('Circuit breaker is open');
    }

    let lastError: any;
    let shouldRetry = false;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      let timeoutId: NodeJS.Timeout | undefined;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), this.circuitBreakerConfig.timeout);
        
        if (options.signal) {
          options.signal.addEventListener('abort', () => controller.abort());
        }
        
        const response: AxiosResponse<T> = await axios({
          url: options.url,
          method: options.method || 'POST',
          headers: options.headers,
          data: options.data,
          signal: controller.signal,
        });
        
        if (timeoutId) clearTimeout(timeoutId);
        
        this.onSuccess();
        return response.data;
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = error;
        
        const axiosError = error as AxiosError;
        const statusCode = axiosError.response?.status;
        
        // Check if we should retry this specific error
        shouldRetry = attempt < this.retryConfig.maxRetries && 
                     this.exponentialBackoff.shouldRetry(attempt, statusCode);
        
        if (shouldRetry) {
          await this.exponentialBackoff.wait(attempt);
        } else {
          break; // Don't retry further
        }
      }
    }
    
    // If we get here, all attempts failed
    this.onFailure(lastError);
    throw lastError;
  }
}