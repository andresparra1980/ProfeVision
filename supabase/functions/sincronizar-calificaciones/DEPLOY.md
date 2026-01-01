# Deployment Instructions - sincronizar-calificaciones

## Critical: Deploy with --no-verify-jwt

This function performs **manual JWT verification** using ES256 via JWKS.

### Deploy command:
```bash
supabase functions deploy sincronizar-calificaciones --no-verify-jwt
```

### Required secrets:
```bash
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
# No need to set them manually
```

### Why --no-verify-jwt?

- Function verifies JWT **manually** using `jose` library
- Uses ES256 (asymmetric keys) via JWKS endpoint
- Default Supabase verification is bypassed for manual control
