# PostHog Post-Wizard Report

The wizard has completed a deep integration of PostHog into ProfeVision. The integration includes:

- **Client-side initialization** via `instrumentation-client.ts` (Next.js 15.3+ pattern)
- **Server-side PostHog client** for API route event tracking
- **Reverse proxy configuration** to avoid ad blockers
- **User identification** on login with automatic reset on logout
- **14 custom events** tracking key user actions across auth, exams, subscriptions, and onboarding

## Events Implemented

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | User successfully created account | `app/[locale]/auth/register/page.tsx` |
| `user_logged_in` | User successfully authenticated | `app/[locale]/auth/login/page.tsx` |
| `user_logged_out` | User logged out (with PostHog reset) | `app/[locale]/dashboard/layout.tsx` |
| `exam_created` | Teacher created a new exam (server-side) | `app/api/exams/route.ts` |
| `exam_draft_saved` | AI-generated exam draft saved | `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/SaveDraftDialog.tsx` |
| `exam_scan_saved` | Scanned exam results saved (server-side) | `app/api/exams/save-results/route.ts` |
| `checkout_initiated` | User started Polar checkout (server-side) | `app/api/polar/checkout/route.ts` |
| `subscription_created` | Plus subscription activated via webhook | `app/api/webhooks/polar/route.ts` |
| `subscription_cancelled` | User cancelled subscription via webhook | `app/api/webhooks/polar/route.ts` |
| `onboarding_step_completed` | User completed onboarding step | `app/api/onboarding/complete-step/route.ts` |
| `pricing_plan_clicked` | User clicked CTA on pricing page | `app/[locale]/(website)/pricing/pricing-content.tsx` |
| `question_edited` | Teacher edited AI-generated question | `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ResultsView.tsx` |
| `question_deleted` | Teacher deleted AI-generated question | `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ResultsView.tsx` |
| `options_randomized` | Teacher randomized exam answer options | `app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ResultsView.tsx` |

## Files Created/Modified

### New Files
- `apps/web/instrumentation-client.ts` - PostHog client initialization
- `apps/web/lib/posthog-server.ts` - Server-side PostHog client

### Modified Files
- `apps/web/next.config.ts` - Added reverse proxy rewrites and skipTrailingSlashRedirect
- `apps/web/.env.local` - Added PostHog environment variables
- `apps/web/app/[locale]/auth/login/page.tsx` - Added identify + login event
- `apps/web/app/[locale]/auth/register/page.tsx` - Added signup event
- `apps/web/app/[locale]/dashboard/layout.tsx` - Added logout event + reset
- `apps/web/app/[locale]/(website)/pricing/pricing-content.tsx` - Added pricing click events
- `apps/web/app/[locale]/dashboard/exams/ai-exams-creation-chat/components/ResultsView.tsx` - Added question edit/delete/randomize events
- `apps/web/app/[locale]/dashboard/exams/ai-exams-creation-chat/components/SaveDraftDialog.tsx` - Added draft saved event
- `apps/web/app/api/exams/route.ts` - Added server-side exam created event
- `apps/web/app/api/exams/save-results/route.ts` - Added server-side scan saved event
- `apps/web/app/api/polar/checkout/route.ts` - Added checkout initiated event
- `apps/web/app/api/webhooks/polar/route.ts` - Added subscription events
- `apps/web/app/api/onboarding/complete-step/route.ts` - Added onboarding event

## Next Steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics Basics](https://us.posthog.com/project/300657/dashboard/1156283) - Core analytics dashboard

### Insights
- [User Signups & Logins Trend](https://us.posthog.com/project/300657/insights/DH88KeUp) - Daily trend of signups and logins
- [Signup to Exam Creation Funnel](https://us.posthog.com/project/300657/insights/vhFjUFuI) - Conversion from signup to first exam
- [Subscription Conversion Funnel](https://us.posthog.com/project/300657/insights/YovBJTLV) - Pricing click → checkout → subscription
- [Exam & Scan Activity](https://us.posthog.com/project/300657/insights/9DdchchW) - Daily exam and scan activity
- [Subscription Churn](https://us.posthog.com/project/300657/insights/CbcQ10lC) - New subscriptions vs cancellations

### Agent Skill

We've left an agent skill folder in your project at `.claude/skills/nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
