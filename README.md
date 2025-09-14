# LLM Circuit Breaker

A robust wrapper for LLM API calls that implements the circuit breaker pattern with retry logic and exponential backoff. This package helps prevent cascading failures when calling LLM APIs by temporarily "opening" the circuit when failures exceed a threshold.

## Features

-  **Circuit Breaker Pattern**: Automatically opens circuit when failure threshold is reached
-  **Retry Logic**: Configurable retry attempts with exponential backoff
-  **Fast Failure**: Immediate failure when circuit is open
-  **Configurable Thresholds**: Customize failure/success thresholds
-  **State Monitoring**: Track circuit state and failure counts
-  **TypeScript Support**: Full TypeScript definitions included

## Installation

```bash
npm install llm-circuit-breaker
```

## Quick Start

```typescript
import { LLMCircuitBreaker } from 'llm-circuit-breaker';

const circuitBreaker = new LLMCircuitBreaker({
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000
  },
  retry: {
    maxRetries: 3,
    initialDelay: 1000
  }
});

try {
  const response = await circuitBreaker.call({
    url: 'https://api.openai.com/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-api-key',
      'Content-Type': 'application/json'
    },
    data: {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello!' }]
    }
  });
  
  console.log(response);
} catch (error) {
  console.error('Request failed:', error.message);
}
```

## Configuration

### Circuit Breaker Options

- `failureThreshold`: Number of failures before opening circuit (default: 5)
- `resetTimeout`: Time in ms to wait before attempting to close circuit (default: 30000)
- `successThreshold`: Number of successes needed to close circuit (default: 3)
- `timeout`: Request timeout in ms (default: 10000)

### Retry Options

- `maxRetries`: Maximum number of retry attempts (default: 3)
- `initialDelay`: Initial delay between retries in ms (default: 1000)
- `maxDelay`: Maximum delay between retries in ms (default: 30000)
- `backoffFactor`: Exponential backoff multiplier (default: 2)
- `retryOnStatusCodes`: HTTP status codes to retry on (default: [429, 500, 502, 503, 504])

## API Reference

### `LLMCircuitBreaker`

#### Constructor

```typescript
new LLMCircuitBreaker(options?: {
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  retry?: Partial<RetryConfig>;
})
```

#### Methods

- `call<T>(options: LLMCallOptions): Promise<T>` - Make an API call through the circuit breaker
- `getState(): CircuitBreakerState` - Get current circuit breaker state

## Examples

### OpenAI Integration

```typescript
import { LLMCircuitBreaker } from 'llm-circuit-breaker';

const openaiCircuitBreaker = new LLMCircuitBreaker({
  circuitBreaker: { failureThreshold: 3 },
  retry: { maxRetries: 2 }
});

const response = await openaiCircuitBreaker.call({
  url: 'https://api.openai.com/v1/chat/completions',
  headers: { 'Authorization': 'Bearer sk-...' },
  data: {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }]
  }
});
```

### Anthropic Integration

```typescript
const anthropicCircuitBreaker = new LLMCircuitBreaker();

const response = await anthropicCircuitBreaker.call({
  url: 'https://api.anthropic.com/v1/messages',
  headers: { 
    'x-api-key': 'your-key',
    'anthropic-version': '2023-06-01'
  },
  data: {
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello!' }]
  }
});
```

## Circuit States

- **CLOSED**: Normal operation, requests are allowed
- **OPEN**: Circuit is open, requests fail immediately
- **HALF_OPEN**: Testing if the service has recovered

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and contribute to the project.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [INSERT CONTACT METHOD].

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.