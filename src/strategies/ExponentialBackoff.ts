import { RetryConfig } from '../types';

export class ExponentialBackoff {
  private maxRetries: number;
  private initialDelay: number;
  private maxDelay: number;
  private backoffFactor: number;
  private retryOnStatusCodes: number[];

  constructor(config: RetryConfig) {
    this.maxRetries = config.maxRetries;
    this.initialDelay = config.initialDelay;
    this.maxDelay = config.maxDelay;
    this.backoffFactor = config.backoffFactor;
    this.retryOnStatusCodes = config.retryOnStatusCodes;
  }

  shouldRetry(attempt: number, statusCode?: number): boolean {
    if (attempt >= this.maxRetries) return false;
    
    if (statusCode && this.retryOnStatusCodes.length > 0) {
      return this.retryOnStatusCodes.includes(statusCode);
    }
    
    return true;
  }

  getDelay(attempt: number): number {
    const delay = this.initialDelay * Math.pow(this.backoffFactor, attempt);
    return Math.min(delay, this.maxDelay);
  }

  async wait(attempt: number): Promise<void> {
    const delay = this.getDelay(attempt);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}