# Supabase Key Migration - High Level Plan

## Overview

Migrate from legacy Supabase keys (`anon`/`service_role` JWT-based) to new system (`sb_publishable_*`/`sb_secret_*`) plus asymmetric JWT signing keys (ES256).

## Two Independent Migrations

| Migration | Current | Target | Benefit |
|-----------|---------|--------|---------|
| **API Keys** | `anon` + `service_role` (JWT) | `sb_publishable_*` + `sb_secret_*` | Independent rotation, no JWT coupling |
| **JWT Signing** | HS256 (shared secret) | ES256 (asymmetric) | Public key verification, no secret exposure |

## Current State

### Environment Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` - Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client access (legacy JWT)
- `SUPABASE_SERVICE_ROLE_KEY` - Server bypass RLS (legacy JWT)
- `SUPABASE_PROJECT_ID` - Project identifier
- `S3_SUPABASE_*` - Storage credentials (unchanged)

### External Services
| Service | Supabase Keys Used | Migration Impact |
|---------|-------------------|------------------|
| **omr-service** | None (own API_KEY) | None |
| **omr-service-direct** | `SUPABASE_JWT_SECRET` | **Critical** - needs JWKS verification |
| **latex-service** | None (own API_KEY) | None |
| **Edge Function** | `SUPABASE_SERVICE_ROLE_KEY` | Needs `--no-verify-jwt` + manual verification |

### Realtime Usage
- **Not used** - no `createChannel` or `supabase.channel` calls found

## Recommended Granular Secret Keys

Based on domain analysis of 29 source files using service role:

| Key Name | Domains | Files Count | Access Pattern |
|----------|---------|-------------|----------------|
| `SUPABASE_SECRET_EXAMS` | exams-core, grading | 11 | CRUD exams/questions/results |
| `SUPABASE_SECRET_AI` | ai-generation, worker | 6 | AI jobs, create exams |
| `SUPABASE_SECRET_ADMIN` | admin, dashboard | 3 | Full read access, auth.admin |
| `SUPABASE_SECRET_ENTITIES` | entities, groups, students | 5 | CRUD entities/groups |
| `SUPABASE_SECRET_WEBHOOKS` | webhooks | 1 | Update profesores subscriptions |
| `SUPABASE_SECRET_EDGE` | edge-functions | 1 | Sync calificaciones |

**Simplified Alternative (3 keys):**
- `SUPABASE_SECRET_APP` - All web app API routes
- `SUPABASE_SECRET_WORKER` - Background job runner
- `SUPABASE_SECRET_EDGE` - Edge functions

## Migration Phases

### Phase 0: Preparation (Dashboard only, no code)
1. Create publishable key in Supabase Dashboard
2. Create secret keys (granular or simplified)
3. Migrate JWT secret to signing keys system
4. Create ES256 standby key

### Phase 1: Dual-Mode Support
1. Update `omr-service-direct` for HS256 + ES256/RS256
2. Update Edge Function for manual JWT verification
3. Add fallback logic in auth utilities

### Phase 2: Client Migration
1. Replace `NEXT_PUBLIC_SUPABASE_ANON_KEY` with publishable key
2. Deploy to Vercel (all environments)
3. Update mobile app (separate repo)

### Phase 3: Server Migration
1. Replace `SUPABASE_SERVICE_ROLE_KEY` with secret key(s)
2. Update env vars in Vercel
3. Update Edge Function secrets
4. Deploy and verify

### Phase 4: Activate Asymmetric Keys
1. Rotate keys in Dashboard (standby -> active)
2. Wait 1h+ for token expiry
3. Verify all services work

### Phase 5: Cleanup
1. Revoke legacy JWT secret
2. Disable `anon` and `service_role` keys
3. Remove fallback code for HS256

## Mobile App Changes Required

The mobile app (separate repo) needs:
1. Update `SUPABASE_ANON_KEY` to `sb_publishable_*`
2. No code changes if using `@supabase/supabase-js` normally
3. If doing direct JWT verification, switch to JWKS endpoint

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Downtime during migration | Both key systems work simultaneously |
| Edge Function breaks | Test with `--no-verify-jwt` before migration |
| OMR service auth fails | Dual-mode HS256/ES256 support |
| Mobile app can't update fast | App stores allow old publishable key |
| Token cache issues | Wait 20min+ between key state changes |

## Rollback Plan

All changes are reversible:
1. Keys can be moved back to standby
2. Legacy keys remain active until explicitly disabled
3. Dual-mode code supports both algorithms

## Decisions Made

1. **Simplified keys (3)** - Start simple, can granularize later if needed:
   - `SUPABASE_SECRET_APP` - All web app API routes
   - `SUPABASE_SECRET_WORKER` - Background job runner  
   - `SUPABASE_SECRET_EDGE` - Edge functions

2. **Edge Function secrets** - Use `supabase secrets set` command

3. **Worker key scope** - Combined key acceptable. Note: Secret keys have NO access limits - all have full `service_role` power. Granularity is only for independent rotation if one is compromised.
