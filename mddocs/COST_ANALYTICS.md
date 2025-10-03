# Cost Analytics with LangSmith & OpenRouter

This document explains how cost tracking and analytics work in ProfeVision's AI-powered exam generation.

## Overview

Every LLM call now includes detailed cost and performance metrics from OpenRouter, automatically tracked in LangSmith.

## What Gets Tracked

### Per Request Metrics

For each exam generation request (`/api/chat`), we track:

#### **Cost Metrics**
- `openrouter_cost` - Total cost in USD (e.g., 0.001610532 = $0.0016)
- `openrouter_generation_id` - Unique ID for this generation

#### **Token Usage**
- `openrouter_tokens_prompt` - Input tokens sent to model
- `openrouter_tokens_completion` - Output tokens generated
- `openrouter_native_tokens_prompt` - Provider's native token count (input)
- `openrouter_native_tokens_completion` - Provider's native token count (output)

#### **Performance Metrics**
- `openrouter_generation_time_ms` - Time model spent generating (ms)
- `openrouter_latency_ms` - Network latency (ms)
- `duration_ms` - Total request duration including parsing

#### **Model Information**
- `openrouter_model` - Actual model used (e.g., "google/gemini-2.5-flash-lite")
- `openrouter_provider` - Provider name (e.g., "Google", "OpenAI", "Anthropic")
- `openrouter_finish_reason` - Why generation stopped ("stop", "length", "error")
- `openrouter_streamed` - Whether response was streamed

#### **Request Context**
- `user_id` - Who made the request
- `language` - Target language
- `num_questions` - Questions requested
- `questions_generated` - Questions actually generated
- `question_types` - Types requested
- `difficulty` - Difficulty level
- `has_existing_exam` - Whether editing existing exam
- `is_fallback` - Whether fallback model was used

## How It Works

### 1. LLM Call
```typescript
const response = await model.invoke(llmMessages);
const generationId = response.response_metadata?.id;
```

### 2. Fetch Stats from OpenRouter
```typescript
const stats = await fetchOpenRouterStats(generationId);
// Retries with delays: 500ms, 1000ms, 2000ms
// OpenRouter needs time to process stats after generation
```

### 3. Inject into LangSmith
```typescript
await langsmithClient.updateRun(runId, {
  outputs: { questions_generated: count },
  extra: { metadata: { ...allStats } }
});
```

## Viewing Cost Data in LangSmith

### 1. Individual Run View
1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Select your project (e.g., "ProfeVision")
3. Click on any run
4. Scroll to **Metadata** section
5. See all `openrouter_*` fields

### 2. Filter by Cost
```
metadata.openrouter_cost > 0.01
```
Find expensive generations (>$0.01)

### 3. Filter by Model
```
metadata.openrouter_model = "google/gemini-2.5-flash-lite"
```
See all runs for a specific model

### 4. Filter by Provider
```
metadata.openrouter_provider = "Google"
```
Compare providers

## Cost Analysis Examples

### Example 1: Find Expensive Requests
**Filter**: `metadata.openrouter_cost > 0.005`

**Use case**: Identify requests that cost more than half a cent

### Example 2: High Token Usage
**Filter**: `metadata.openrouter_tokens_completion > 5000`

**Use case**: Find generations with very long outputs

### Example 3: Slow Generations
**Filter**: `metadata.openrouter_generation_time_ms > 10000`

**Use case**: Find requests taking >10 seconds

### Example 4: Fallback Usage
**Filter**: `metadata.is_fallback = true`

**Use case**: Track when primary model fails

## Console Logs

### Successful Generation
```
[API] /api/chat:LLM request { model: 'google/gemini-2.5-flash-lite', messageCount: 5, hasFallback: false }
[API] /api/chat:LLM response received { contentType: 'string', hasContent: true, generationId: 'gen-...' }
[API] OpenRouter stats not ready yet, retrying... { attempt: 1, nextDelayMs: 500 }
[API] /api/chat:Cost analysis {
  cost: 0.001610532,
  tokens_prompt: 3467,
  tokens_completion: 3048,
  generation_time_ms: 9567,
  model: 'google/gemini-2.5-flash-lite',
  provider: 'Google'
}
[PERF] /api/chat:OK { ms: 11514 }
```

### With Fallback
```
[WARN] /api/chat:Primary model failed, trying fallback { model: 'google/gemini-2.5-flash-lite', fallbackModel: 'mistralai/ministral-8b' }
[API] /api/chat:Fallback response received { ... }
[API] /api/chat:Fallback cost analysis { cost: 0.000234, ... }
```

## Cost Optimization Tips

### 1. Monitor Token Usage
- Track `tokens_prompt` to see if prompts are too long
- Consider reducing system prompt verbosity
- Remove unnecessary context from messages

### 2. Compare Models
- Filter by `openrouter_provider` to compare costs
- Check `generation_time_ms` vs `cost` tradeoff
- Test cheaper models for simple tasks

### 3. Identify Patterns
- High cost correlates with:
  - More questions requested
  - Complex question types (essay > multiple choice)
  - Editing existing exams (more context)
  - Multiple documents/summaries

### 4. Set Budgets
- Use LangSmith's cost tracking to set monthly budgets
- Get alerts when approaching limits
- Track cost per user if needed

## Aggregated Analytics

### In LangSmith Analytics Tab

**Total Cost Over Time**
- View daily/weekly/monthly spend
- Trend analysis
- Cost projections

**Cost by Model**
- Compare different models
- See which is most cost-effective
- Track fallback usage costs

**Cost by User**
- Filter by `user_id`
- Identify heavy users
- Fair usage policies

**Cost by Feature**
- Filter by tags: `chat-api` vs `similar-exam`
- See which feature costs more
- Optimize expensive features

## Troubleshooting

### Stats Not Appearing

**Issue**: `openrouter_*` fields missing in LangSmith

**Solutions**:
1. Check console for "Failed to fetch OpenRouter stats"
2. Verify `OPENROUTER_API_KEY` is set
3. Check if `generationId` was captured
4. OpenRouter may be rate-limiting stats endpoint

### Stats Taking Too Long

**Issue**: Request hangs waiting for stats

**Current behavior**:
- Retries: 500ms, 1000ms, 2000ms (total ~3.5s max)
- Non-blocking - won't fail request if stats unavailable
- Stats fetch happens after response is ready

**To adjust**: Modify delays in `fetchOpenRouterStats()`

### Incomplete Stats

**Issue**: Some `openrouter_*` fields are undefined

**Reason**: OpenRouter response format varies by model/provider

**Solution**: Check OpenRouter docs for your specific model

## API Reference

### OpenRouter Generation Stats Response

```typescript
{
  data: {
    id: string;                          // Generation ID
    created_at: string;                  // ISO timestamp
    model: string;                       // Model used
    app_id: number;                      // Your app ID
    streamed: boolean;                   // Was streamed
    latency: number;                     // Network latency (ms)
    generation_time: number;             // Generation time (ms)
    tokens_prompt: number;               // Input tokens
    tokens_completion: number;           // Output tokens
    native_tokens_prompt: number;        // Provider's input tokens
    native_tokens_completion: number;    // Provider's output tokens
    finish_reason: string;               // "stop", "length", "error"
    usage: number;                       // Cost in USD
    total_cost: number;                  // Same as usage
    provider_name: string;               // "Google", "OpenAI", etc.
    upstream_id: string | null;          // Provider's ID
  }
}
```

## Best Practices

1. **Regular Review**: Check LangSmith weekly for cost trends
2. **Set Alerts**: Configure alerts for high-cost requests
3. **Compare Models**: A/B test different models for cost/quality
4. **Optimize Prompts**: Reduce token usage without sacrificing quality
5. **Track by User**: Monitor per-user costs for fair usage
6. **Budget Planning**: Use historical data for budget forecasts

## Example Queries in LangSmith

### Most Expensive Requests This Week
```
metadata.openrouter_cost > 0.01
AND created_at > "2025-10-01"
```

### Average Cost by Model
Group by: `metadata.openrouter_model`
Aggregate: `AVG(metadata.openrouter_cost)`

### Fallback Success Rate
```
metadata.is_fallback = true
```
Count successes vs total

### Token Efficiency
```
metadata.openrouter_tokens_completion / metadata.questions_generated
```
Tokens per question generated

## Cost Estimates

### Typical Costs (as of 2025)

**Google Gemini 2.5 Flash Lite**:
- ~$0.001-0.002 per request (5-10 questions)
- ~3000-4000 input tokens
- ~2000-3000 output tokens

**Fallback Models** (e.g., Mistral):
- Usually cheaper: ~$0.0002-0.0005
- Faster but may be less accurate

**Monthly Estimates**:
- 1000 requests/month: ~$1.50-2.00
- 10000 requests/month: ~$15-20
- Heavy usage (100k/month): ~$150-200

## Additional Resources

- [OpenRouter Pricing](https://openrouter.ai/docs#models)
- [LangSmith Cost Tracking](https://docs.smith.langchain.com/observability/cost-tracking)
- [OpenRouter Generation API](https://openrouter.ai/docs#generation-stats)

---

**All cost data is automatically tracked - no additional configuration needed!** 💰
