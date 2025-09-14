export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening the circuit
  resetTimeout: number; // Time in ms to wait before attempting to close the circuit
  successThreshold: number; // Number of successful calls before closing the circuit
  timeout: number; // Time in ms before request times out
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryOnStatusCodes: number[];
}

export interface LLMCallOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  data?: any;
  signal?: AbortSignal;
}

export interface CircuitBreakerState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailure: number | null;
  nextAttempt: number | null;
}

export interface LLMCircuitBreakerOptions {
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  retry?: Partial<RetryConfig>;
}