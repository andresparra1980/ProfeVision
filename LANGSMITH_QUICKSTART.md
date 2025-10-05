# LangSmith Integration - Quick Start ✅

LangSmith observability has been integrated into your exam similarity pipeline!

## ⚡ Quick Setup (2 minutes)

### 1. Add Your API Key

Edit `.env.local` and add:

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your-api-key-from-langsmith
LANGCHAIN_PROJECT=ProfeVision
```

Get your API key: [https://smith.langchain.com/settings](https://smith.langchain.com/settings)

### 2. Restart Server

```bash
yarn dev
```

### 3. Test It Out

1. Generate a similar exam through your app
2. Go to [https://smith.langchain.com](https://smith.langchain.com)
3. View your trace under the "ProfeVision" project

## 🎯 What You Get

### Automatic Tracing
Every AI operation is now traced with:

**Similar Exam Pipeline** (`/api/exams/similar/start`):
- ✅ Full pipeline execution flow
- ✅ Every LLM call (generate, validate, fallback)
- ✅ Input prompts and outputs
- ✅ Token usage and costs
- ✅ Execution times per step
- ✅ Error details when failures occur

**Chat Exam Generation** (`/api/chat`):
- ✅ Complete request/response cycle
- ✅ User prompts and AI responses
- ✅ Question generation parameters
- ✅ Model selection and fallback attempts
- ✅ Token usage and costs
- ✅ Success/failure tracking

### Rich Metadata

**Similar Exam Pipeline**:
- Job ID (links to your database)
- User ID
- Source exam details
- Language and seed
- Number of questions
- Tags: `exam-generation`, `similar-exam`

**Chat API**:
- User ID
- Language and difficulty
- Number of questions requested
- Question types
- Whether editing existing exam
- Number of documents/summaries
- Model used and fallback availability
- **OpenRouter Cost Analytics**:
  - Generation ID
  - Total cost (USD)
  - Tokens (prompt/completion)
  - Generation time (ms)
  - Provider name
  - Finish reason
- Tags: `exam-generation`, `chat-api`

## 📊 What's Been Modified

### Files Changed
1. **`package.json`** - Added `langsmith` package
2. **`.env.local.example`** - Added LangSmith config template
3. **`lib/ai/similar-exam/llm/client.ts`** - Added metadata support
4. **`lib/ai/similar-exam/chains/pipeline.ts`** - Added jobId passing and tracing
5. **`worker/jobRunner.ts`** - Wrapped pipeline with traceable decorator
6. **`app/api/chat/route.ts`** - Added tracing + OpenRouter cost analytics

### No Breaking Changes
- ✅ Works with or without LangSmith configured
- ✅ If API key missing, tracing is simply skipped
- ✅ Zero impact on existing functionality
- ✅ No performance degradation
- ✅ Cleaned console logs - verbose request/response logging removed (now in LangSmith)

## 🔍 How to Use

### View a Specific Job
1. Get `jobId` from your database or API response
2. In LangSmith, filter: `metadata.job_id = <jobId>`
3. Click the trace to see full execution details

### Debug Failures
1. Look for failed runs (red status)
2. Click to see which step failed
3. View the exact LLM input/output that caused the error
4. Check error messages and stack traces

### Monitor Costs
1. Go to Analytics tab in LangSmith
2. View token usage trends
3. See cost breakdowns by model
4. Identify expensive operations

## 📚 Full Documentation

- **`mddocs/LANGSMITH_SETUP.md`** - Complete setup and configuration guide
- **`mddocs/COST_ANALYTICS.md`** - Cost tracking and optimization guide

Topics covered:
- Detailed configuration options
- Advanced filtering and searching
- **Cost analytics and OpenRouter integration**
- **Token usage optimization**
- Troubleshooting guide
- Best practices

## 🎓 Example Trace Structure

### Similar Exam Pipeline
```
similar_exam_pipeline (job_id: abc-123)
├── loadBlueprint (0.2s)
├── generate (15.3s)
│   ├── ChatOpenAI.invoke
│   │   ├── Input: blueprint + reference questions
│   │   └── Output: generated exam JSON
│   └── Tokens: 2,450 input / 3,120 output
├── validate (8.1s)
│   ├── ChatOpenAI.invoke
│   │   ├── Input: generated exam
│   │   └── Output: validation recommendations
│   └── Tokens: 3,120 input / 245 output
├── apply (0.1s)
├── randomize (0.3s)
└── finalize (0.2s)

Total: 24.2s | Cost: $0.08
```

### Chat Exam Generation
```
chat_exam_generation
├── ChatOpenAI.invoke (9.5s)
│   ├── Input: system prompts + user messages
│   ├── Output: exam JSON
│   ├── Tokens: 3,467 prompt / 3,048 completion
│   ├── Cost: $0.0016
│   └── Metadata:
│       ├── openrouter_generation_id: gen-...
│       ├── openrouter_model: google/gemini-2.5-flash-lite
│       ├── openrouter_provider: Google
│       ├── openrouter_generation_time_ms: 9567
│       ├── openrouter_latency_ms: 586
│       ├── questions_generated: 13
│       └── user_id: ...
└── JSON parsing & validation (0.3s)

Total: 11.5s | Cost: $0.0016
```

## 🚀 Next Steps

1. **Add your API key** to `.env.local`
2. **Generate a test exam** to create your first trace
3. **Explore LangSmith** to see all the insights
4. **Set up alerts** for failures or high costs (optional)
5. **Create separate projects** for dev/staging/production (optional)

## ❓ Questions?

- Check `mddocs/LANGSMITH_SETUP.md` for detailed docs
- Visit [LangSmith Docs](https://docs.smith.langchain.com/)
- Review your traces at [smith.langchain.com](https://smith.langchain.com)

---

**That's it! You're ready to observe your AI pipeline in action.** 🎉
