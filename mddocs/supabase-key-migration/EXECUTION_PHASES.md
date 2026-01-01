# Supabase Key Migration - Execution Phases

## Phase 0: Dashboard Preparation

**Duration:** 30 min  
**Risk:** None  
**Rollback:** N/A

### 0.1 Create New API Keys
- [ ] Go to [API Keys Settings](https://supabase.com/dashboard/project/_/settings/api-keys)
- [ ] Click "Create new API Keys"
- [ ] Copy `sb_publishable_*` key
- [ ] Create 3 secret keys (simplified strategy):
  - `SUPABASE_SECRET_APP` - Web app API routes
  - `SUPABASE_SECRET_WORKER` - Background job runner
  - `SUPABASE_SECRET_EDGE` - Edge functions
- [ ] Store all keys securely (password manager)

> **Note:** All secret keys have identical permissions (full service_role access). Separation is only for independent rotation if one is compromised.

### 0.2 Migrate JWT Secret
- [ ] Go to [JWT Signing Keys](https://supabase.com/dashboard/project/_/settings/jwt)
- [ ] Click "Migrate JWT secret"
- [ ] Verify ES256 standby key is created
- [ ] **DO NOT rotate yet** - wait for code changes

---

## Phase 1: Dual-Mode Code Support

**Duration:** 2-4 hours  
**Risk:** Low (no key changes yet)  
**Rollback:** Revert commits

### 1.1 Update omr-service-direct

**File:** `services/omr-service-direct/omr_api_direct.py`

```python
# Add imports
from jwt import PyJWKClient
from functools import lru_cache
import jwt

# Add config
SUPABASE_JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json" if SUPABASE_URL else ""

# Add JWKS client with cache
_jwks_client = None

def get_jwks_client():
    global _jwks_client
    if _jwks_client is None and SUPABASE_JWKS_URL:
        _jwks_client = PyJWKClient(SUPABASE_JWKS_URL, cache_keys=True, lifespan=600)
    return _jwks_client

# Update verify_supabase_jwt function
async def verify_supabase_jwt(authorization: str = Header(None, alias="Authorization")):
    """Verify Supabase JWT - supports both HS256 (legacy) and ES256/RS256 (new)"""
    
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Get algorithm from token header
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")
        
        if alg == "HS256":
            # Legacy: symmetric key verification
            if not SUPABASE_JWT_SECRET:
                raise HTTPException(status_code=500, detail="JWT secret not configured")
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
        else:
            # New: asymmetric key verification via JWKS
            jwks_client = get_jwks_client()
            if not jwks_client:
                raise HTTPException(status_code=500, detail="JWKS not configured")
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience="authenticated"
            )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Update requirements.txt:**
```
PyJWT[crypto]>=2.8.0
```

- [ ] Apply code changes
- [ ] Test locally with current HS256 tokens
- [ ] Deploy to server (still using legacy keys)

### 1.2 Update Edge Function

**File:** `supabase/functions/sincronizar-calificaciones/index.ts`

The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` which Supabase provides automatically. When migrating:

1. Deploy with `--no-verify-jwt` flag
2. Add manual JWT verification inside the function

```typescript
// Add at top of function
import { jwtVerify, createRemoteJWKSet } from 'https://deno.land/x/jose@v5.2.0/index.ts';

const JWKS = createRemoteJWKSet(
  new URL(`${Deno.env.get('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`)
);

// Add verification helper
async function verifyJWT(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.replace('Bearer ', '');
  
  try {
    await jwtVerify(token, JWKS);
    return true;
  } catch {
    return false;
  }
}

// At start of serve handler
const authHeader = req.headers.get('Authorization');
const isValidJWT = await verifyJWT(authHeader);
if (!isValidJWT) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

- [ ] Update function code
- [ ] Test locally with `supabase functions serve`
- [ ] Deploy with `supabase functions deploy sincronizar-calificaciones --no-verify-jwt`

### 1.3 Create Auth Utility Wrapper

**File:** `apps/web/lib/supabase/server.ts`

No changes needed - `createAdminSupabaseClient()` already uses env var. Just need to update the env var value later.

---

## Phase 2: Client Migration

**Duration:** 1 hour  
**Risk:** Low  
**Rollback:** Revert env var in Vercel

### 2.1 Update Vercel Environment

```bash
# Remove old key
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY --yes

# Add new publishable key (for each environment)
echo "sb_publishable_xxxxx" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "sb_publishable_xxxxx" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "sb_publishable_xxxxx" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
```

- [ ] Update Production
- [ ] Update Preview
- [ ] Update Development
- [ ] Trigger redeploy: `vercel --prod`
- [ ] Verify app works (login, dashboard, etc.)

### 2.2 Mobile App (Separate Repo)

Update environment/config with new publishable key:
```
SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

- [ ] Update mobile app config
- [ ] Test authentication flow
- [ ] Submit to app stores if needed

---

## Phase 3: Server Migration

**Duration:** 1-2 hours  
**Risk:** Medium  
**Rollback:** Revert env vars

### 3.1 Update Vercel Server Keys

```bash
# Remove old key
vercel env rm SUPABASE_SERVICE_ROLE_KEY --yes

# Add new secret key
echo "sb_secret_xxxxx" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "sb_secret_xxxxx" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview
echo "sb_secret_xxxxx" | vercel env add SUPABASE_SERVICE_ROLE_KEY development
```

- [ ] Update all environments
- [ ] Trigger redeploy

### 3.2 Update OMR Service Direct

```bash
# SSH to server
ssh omr-server

# Update .env
nano /path/to/omr-service-direct/.env
# SUPABASE_JWT_SECRET can remain for HS256 fallback
# Or remove if only using asymmetric

# Restart service
sudo systemctl restart omr-service-direct
```

- [ ] Update .env on server
- [ ] Restart service
- [ ] Test OMR processing

### 3.3 Update Edge Function Secrets

```bash
# Set new secret key for edge function (use SUPABASE_SECRET_EDGE)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sb_secret_edge_xxxxx

# Verify secrets are set
supabase secrets list
```

- [ ] Update secret via `supabase secrets set`
- [ ] Verify with `supabase secrets list`
- [ ] Test function invocation

### 3.4 Verify All Endpoints

Test critical paths:
- [ ] User login/signup
- [ ] Create exam
- [ ] Process scan (OMR)
- [ ] Grade exam
- [ ] Sync grades (Edge Function)
- [ ] AI chat
- [ ] Dashboard stats

---

## Phase 4: Activate Asymmetric Keys

**Duration:** 2 hours (including wait time)  
**Risk:** Medium  
**Rollback:** Move key back to standby

### 4.1 Rotate JWT Signing Keys

- [ ] Go to [JWT Signing Keys](https://supabase.com/dashboard/project/_/settings/jwt)
- [ ] Click "Rotate keys" to activate ES256
- [ ] **Wait 1 hour minimum** (or your accessTokenExpiresIn + 15 min)

### 4.2 Verify Asymmetric Auth Works

- [ ] Login with fresh session
- [ ] Check JWT header shows `alg: ES256`
- [ ] Test OMR service with new token
- [ ] Test Edge Function

---

## Phase 5: Cleanup

**Duration:** 30 min  
**Risk:** Low (if Phase 4 verified)  
**Rollback:** Re-enable legacy keys

### 5.1 Revoke Legacy JWT Secret

- [ ] In JWT Signing Keys, move legacy to "Revoked"
- [ ] Verify all services still work

### 5.2 Disable Legacy API Keys

- [ ] Go to API Keys > Legacy tab
- [ ] Verify "Last used" shows no recent activity
- [ ] Disable `anon` key
- [ ] Disable `service_role` key

### 5.3 Remove Fallback Code

**File:** `services/omr-service-direct/omr_api_direct.py`

Remove HS256 fallback logic if no longer needed:
```python
# Remove SUPABASE_JWT_SECRET config
# Remove HS256 branch in verify_supabase_jwt
```

- [ ] Remove legacy code
- [ ] Deploy final version
- [ ] Remove `SUPABASE_JWT_SECRET` from server .env

---

## Verification Checklist

### Critical Paths
- [ ] Anonymous user can view public pages
- [ ] User can sign up
- [ ] User can login
- [ ] User can create exam
- [ ] User can scan exam (OMR)
- [ ] User can view results
- [ ] User can sync grades
- [ ] Admin can view dashboard
- [ ] Webhooks work (Polar)

### Service Health
- [ ] Web app: no auth errors
- [ ] OMR service: processes scans
- [ ] Edge function: syncs grades
- [ ] Mobile app: authenticates

---

## Rollback Procedures

### If Phase 2 fails (Client)
```bash
# Restore old anon key
echo "eyJhbGciOiJIUzI1NiIs..." | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel --prod
```

### If Phase 3 fails (Server)
```bash
# Restore old service role key
echo "eyJhbGciOiJIUzI1NiIs..." | vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel --prod
```

### If Phase 4 fails (Asymmetric)
1. Go to JWT Signing Keys
2. Move ES256 key back to "Standby"
3. Move legacy key back to "In Use"
