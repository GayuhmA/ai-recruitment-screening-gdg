# ⚡ Rate Limiting Implementation

## Overview

The AI Recruitment Backend now implements comprehensive rate limiting to ensure a lighter, smoother API experience and protect against abuse.

## Features Implemented

### ✅ Global Rate Limiting
- **Limit**: 100 requests per minute per IP address
- **Applies to**: All endpoints
- **Cache**: 10,000 entries for request tracking
- **Whitelist**: localhost (127.0.0.1) for development

### ✅ Endpoint-Specific Rate Limits

Different operations have different limits based on their resource intensity:

#### Read Operations (GET)
- **No additional limits** - Uses global 100 req/min limit
- Lightweight operations can use the full global quota

#### Write Operations (POST)
- **Jobs**: 20 creations per minute
- **Candidates**: 20 creations per minute
- **Applications**: 25 creations per minute
- **CV Uploads**: **10 per minute** (most resource-intensive)

#### Update Operations (PATCH)
- **Jobs**: 30 updates per minute
- **Candidates**: 30 updates per minute
- **Applications**: 30 updates per minute

#### Delete Operations (DELETE)
- **Jobs**: 15 deletions per minute
- **Candidates**: 15 deletions per minute
- **Applications**: 15 deletions per minute
- **CVs**: 15 deletions per minute

## Configuration

### Rate Limit Settings

```typescript
// Global rate limiting
await app.register(rateLimit, {
  max: 100,                    // Max requests per timeWindow
  timeWindow: "1 minute",      // Time window
  cache: 10000,                // Cache size
  allowList: ["127.0.0.1"],    // Whitelist localhost
  skipOnError: true,           // Continue on rate limit errors
  keyGenerator: (req) => req.ip, // Rate limit by IP
});
```

### Route-Specific Configuration

```typescript
// Example: CV Upload with stricter limit
app.post("/applications/:applicationId/cv", {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
  handler: async (req, reply) => {
    // Handler logic...
  },
});
```

## Rate Limit Response Headers

When a request is made, the following headers are returned:

- `X-RateLimit-Limit`: Maximum requests allowed in the time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when the rate limit resets

## Error Response

When rate limit is exceeded:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 42 seconds.",
  "retryAfter": 42000
}
```

## Benefits

### 🚀 Performance
- Prevents resource exhaustion from rapid requests
- Ensures fair resource distribution among users
- Reduces server load during peak times

### 🛡️ Security
- Protects against brute force attacks
- Mitigates DDoS attempts
- Prevents API abuse

### 💡 User Experience
- Smoother API responses
- More predictable performance
- Clear feedback when limits are reached

## Testing

### Quick Test
```powershell
# Run the rate limit test script
.\test-rate-limit.ps1
```

### Manual Testing
```powershell
# Test global rate limit
for ($i = 1; $i -le 110; $i++) {
    Invoke-RestMethod -Uri "http://127.0.0.1:3001/health"
}
# After 100 requests, you should get 429 errors

# Test CV upload limit
for ($i = 1; $i -le 15; $i++) {
    # Upload CV (multipart form data)
    # After 10 uploads, you should get 429 errors
}
```

## Configuration Options

### Adjusting Limits

To modify rate limits, edit the configuration in `src/server.ts`:

```typescript
// Global limit
max: 100,           // Increase/decrease as needed
timeWindow: "1 minute",  // Can use: "1 second", "5 minutes", "1 hour"

// Endpoint-specific
config: {
  rateLimit: {
    max: 20,        // Adjust per endpoint
    timeWindow: "1 minute",
  },
}
```

### Disabling for Development

To disable rate limiting temporarily:

```typescript
// Comment out the rate limit registration
// await app.register(rateLimit, { ... });
```

### Production Recommendations

For production environments:

1. **Use Redis for distributed rate limiting**:
   ```typescript
   await app.register(rateLimit, {
     redis: redisClient,  // Shared state across instances
     // ... other options
   });
   ```

2. **Adjust limits based on your infrastructure**:
   - Higher limits for powerful servers
   - Lower limits for constrained resources
   - Different limits for authenticated vs. public users

3. **Monitor rate limit hits**:
   - Log rate limit violations
   - Alert on unusual patterns
   - Adjust limits based on real usage

## Architecture

### Rate Limiting Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Extract IP Address  │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│ Check Request Count  │◄──── In-Memory Cache
└──────┬───────────────┘      (or Redis)
       │
       ├── Under Limit ──────┐
       │                     ▼
       │              ┌─────────────┐
       │              │  Process    │
       │              │  Request    │
       │              └──────┬──────┘
       │                     │
       │                     ▼
       │              ┌──────────────────┐
       │              │ Increment Counter│
       │              └──────┬───────────┘
       │                     │
       │                     ▼
       │              ┌──────────────────────┐
       │              │ Return with Headers  │
       │              │ - X-RateLimit-Limit  │
       │              │ - X-RateLimit-Remain │
       │              └──────────────────────┘
       │
       └── Over Limit ────┐
                         ▼
                  ┌──────────────┐
                  │ Return 429   │
                  │ Too Many     │
                  │ Requests     │
                  └──────────────┘
```

## Implementation Details

### Key Generator

Rate limiting is applied per IP address:
```typescript
keyGenerator: (req) => req.ip
```

This ensures each client gets their own quota independently.

### Whitelist

Localhost is whitelisted for development:
```typescript
allowList: ["127.0.0.1"]
```

Remove this in production for stricter control.

### Skip on Error

If rate limiting encounters an error, requests continue:
```typescript
skipOnError: true
```

This ensures availability even if rate limiting fails.

## Troubleshooting

### Issue: Rate limit not working
- Check if `@fastify/rate-limit` is installed: `npm list @fastify/rate-limit`
- Verify configuration is correct in `src/server.ts`
- Check if localhost whitelist is affecting tests

### Issue: Too restrictive
- Increase `max` value in configuration
- Increase `timeWindow` (e.g., "5 minutes")
- Consider whitelisting trusted IPs

### Issue: Rate limit persists after time window
- Restart server to clear in-memory cache
- Use Redis for distributed systems with automatic TTL

## Future Enhancements

Potential improvements:

1. **User-based rate limiting**: Different limits per user role
2. **API key tiers**: Premium users get higher limits
3. **Dynamic rate limiting**: Adjust based on server load
4. **Rate limit bypass**: For trusted services/internal calls
5. **Custom time windows**: Different windows per endpoint
6. **Burst allowance**: Allow short bursts above steady-state limit

## Monitoring

Track rate limiting metrics:

```typescript
// Add logging for rate limit hits
app.addHook('onError', async (request, reply, error) => {
  if (reply.statusCode === 429) {
    console.log(`Rate limit hit: ${request.ip} on ${request.url}`);
  }
});
```

## Summary

✅ **Implemented**: Comprehensive rate limiting at global and endpoint levels  
✅ **Benefits**: Lighter API, smoother experience, better security  
✅ **Configurable**: Easy to adjust limits per endpoint  
✅ **Production-ready**: Supports Redis for distributed systems  
✅ **Developer-friendly**: Localhost whitelisted, clear error messages

---

**Dependencies**:
- `@fastify/rate-limit`: ^10.2.0

**Configuration File**: `src/server.ts`  
**Test Script**: `test-rate-limit.ps1`  
**Documentation**: This file
