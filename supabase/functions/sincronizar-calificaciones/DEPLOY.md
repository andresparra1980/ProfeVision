# Deployment Instructions - sincronizar-calificaciones

## Critical: Deploy with --no-verify-jwt

This function performs **manual JWT verification** to support dual-mode authentication (HS256 legacy + ES256 new).

### Deploy command:
```bash
supabase functions deploy sincronizar-calificaciones --no-verify-jwt
```

### Required secrets:
```bash
# Legacy HS256 secret (keep during migration)
supabase secrets set SUPABASE_JWT_SECRET=your_jwt_secret

# Service role for Supabase client
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Why --no-verify-jwt?

- Function verifies JWT **manually** using `jose` library
- Supports both HS256 (legacy shared secret) and ES256 (new JWKS)
- Allows zero-downtime migration during Phase 4
- Default Supabase verification only supports one method at a time
