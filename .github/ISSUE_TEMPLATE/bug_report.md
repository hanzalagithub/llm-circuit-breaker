---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Initialize circuit breaker with config '...'
2. Call the API with '....'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Code Example**
```typescript
// Provide a minimal code example that reproduces the issue
const circuitBreaker = new LLMCircuitBreaker({
  // your config
});

// Your failing code here
```

**Error Output**
```
Paste any error messages here
```

**Environment (please complete the following information):**
 - Node.js version: [e.g. 18.0.0]
 - Package version: [e.g. 1.0.0]
 - Operating System: [e.g. Windows 11, macOS 13, Ubuntu 22.04]

**Additional context**
Add any other context about the problem here.
