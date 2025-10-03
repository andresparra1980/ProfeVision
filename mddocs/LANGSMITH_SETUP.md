# LangSmith Observability Setup

This guide explains how to integrate LangSmith for AI observability in the ProfeVision exam similarity pipeline.

## What is LangSmith?

LangSmith is an observability platform for LLM applications that provides:
- **Tracing**: See every step of your AI pipeline execution
- **Debugging**: Inspect inputs, outputs, and latency for each LLM call
- **Monitoring**: Track costs, performance, and errors
- **Analytics**: Understand usage patterns and optimize your AI workflows

## Setup Instructions

### 1. Get Your LangSmith API Key

1. Go to [https://smith.langchain.com/settings](https://smith.langchain.com/settings)
2. Sign in with your existing account
3. Navigate to **API Keys** section
4. Create a new API key or copy an existing one

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# LangSmith Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your-api-key-here
LANGCHAIN_PROJECT=ProfeVision
```

**Important**: 
- Replace `your-api-key-here` with your actual LangSmith API key
- You can customize `LANGCHAIN_PROJECT` to any project name you want in LangSmith
- **Never** commit your `.env.local` file to version control

### 3. Restart Your Development Server

After adding the environment variables, restart your Next.js server:

```bash
yarn dev
```

## What Gets Traced?

The integration automatically traces:

### Similar Exam Pipeline
- **Full pipeline execution** for each exam generation job
- Metadata includes:
  - Job ID
  - User ID
  - Source exam ID
  - Language
  - Exam title
  - Number of questions
  - Random seed

### Chat Exam Generation
- **Complete request/response** for each chat interaction
- **LLM calls** via ChatOpenAI with automatic tracing
- **Fallback attempts** when primary model fails
- Metadata includes:
  - User ID
  - Language
  - Difficulty
  - Question types
  - Number of questions
  - Cost and token usage

### Document Summarization
- **Text mode**: Summarization of text documents
- **Vision mode**: Summarization of images/visual documents
- **Pipeline structure**: `document_summarize` → `ChatOpenAI` → `openrouter_cost`
- Metadata includes:
  - Mode (text/vision)
  - Model used
  - Token usage
  - Generation time
  - Cost breakdown

## Viewing Traces in LangSmith

1. Go to [https://smith.langchain.com](https://smith.langchain.com)
2. Select your project (e.g., "ProfeVision")
3. You'll see all traced runs with:
   - **Status**: Success, Error, or In Progress
   - **Duration**: Total execution time
   - **Tokens**: Input/output tokens used
   - **Cost**: Estimated cost per run
   - **Tags**: `exam-generation`, `similar-exam`, `chat-api`, `document-summarize`, `text-mode`, `vision-mode`

4. Click on any run to see:
   - Full execution trace tree
   - Input/output for each step
   - LLM prompts and responses
   - Error details (if any)
   - Timeline visualization

## Filtering and Searching

Use LangSmith's filters to find specific runs:

- **By metadata**: Filter by `job_id`, `user_id`, `exam_title`, etc.
- **By tags**: Filter by `exam-generation` or `similar-exam`
- **By status**: Success, Error, or specific error types
- **By date range**: View historical runs

## Debugging Failed Jobs

When an exam generation job fails:

1. Find the job ID in your database (`procesos_examen_similar` table)
2. In LangSmith, filter by `metadata.job_id = <your-job-id>`
3. Click on the failed run to see:
   - Which step failed (generate, validate, etc.)
   - The exact error message
   - LLM input that caused the failure
   - Response that was attempted to parse

## Cost Monitoring

LangSmith automatically tracks:
- **Token usage** per run
- **Estimated costs** based on model pricing
- **Aggregate statistics** over time

View these in the Analytics section to:
- Identify expensive operations
- Optimize prompt sizes
- Choose cost-effective models

## Disabling LangSmith

To disable tracing (e.g., in production if not needed):

```bash
# In .env.local or .env.production
LANGCHAIN_TRACING_V2=false
```

Or simply remove/comment out all `LANGCHAIN_*` variables.

## Best Practices

1. **Use descriptive project names**: Create separate projects for dev, staging, and production
2. **Add custom metadata**: Already implemented for job details, but you can extend it
3. **Set up alerts**: Configure LangSmith to notify you of failures or high costs
4. **Review regularly**: Check traces weekly to identify optimization opportunities
5. **Clean up old data**: Archive or delete old traces to keep your project organized

## Troubleshooting

### Traces Not Appearing

**Check environment variables**:
```bash
echo $LANGCHAIN_TRACING_V2
echo $LANGCHAIN_API_KEY
```

**Verify API key** in LangSmith settings

**Check server logs** for LangSmith connection errors

### High Latency

- LangSmith adds minimal overhead (~10-50ms per trace)
- Network issues to LangSmith can cause delays
- Tracing is async and shouldn't block your main pipeline

### Missing Metadata

- Ensure `jobId` is passed through the pipeline
- Check that metadata objects are serializable (no circular references)

## Additional Resources

- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [LangChain Tracing Guide](https://python.langchain.com/docs/langsmith/how_to_guides/tracing)
- [LangSmith API Reference](https://docs.smith.langchain.com/reference/api)

## Support

For issues specific to this integration:
1. Check this documentation
2. Review traces in LangSmith for error details
3. Check application logs in your console

For LangSmith platform issues:
- [LangSmith Support](https://support.langchain.com/)
- [Community Discord](https://discord.gg/langchain)
