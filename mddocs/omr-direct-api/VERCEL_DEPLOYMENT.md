# OMR Direct API - Vercel Deployment Checklist

## Pre-requisitos

- [ ] OMR Direct API desplegado en Hetzner
- [ ] Domain `omr-direct.profevision.com` apuntando a servidor
- [ ] SSL configurado (HTTPS)
- [ ] Health check funcionando: `https://omr-direct.profevision.com/health`

## Configuración Vercel

### 1. Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

```env
# OMR Direct API
NEXT_PUBLIC_USE_DIRECT_OMR=true
NEXT_PUBLIC_OMR_DIRECT_URL=https://omr-direct.profevision.com

# Aplicar a:
# ✅ Production
# ✅ Preview
# ✅ Development (opcional, puede usar localhost)
```

### 2. Build Settings

No requiere cambios - es código client-side.

## Configuración OMR Direct Server

### 1. CORS

En servidor Hetzner, `/omr-service-direct/.env`:

```env
ALLOWED_ORIGINS=https://profevision.com,https://testing.profevision.com,https://*.vercel.app,http://localhost:3000
```

**Nota**: El wildcard `*.vercel.app` permite preview deployments.

### 2. Restart servicio

```bash
cd /path/to/omr-service-direct
docker-compose restart
```

## Testing

### 1. Test Local (Development)

```bash
# En tu máquina local
NEXT_PUBLIC_USE_DIRECT_OMR=true yarn dev

# Escanear examen desde browser
# Verificar en DevTools Console:
# "Using OMR Direct API: http://localhost:8082/process"
```

### 2. Test Preview (Vercel)

```bash
# Push a branch
git push origin feature/omr-direct-api

# Vercel crea preview deployment automáticamente
# URL: https://profevision-xyz123.vercel.app

# Escanear examen
# Verificar en DevTools:
# "Using OMR Direct API: https://omr-direct.profevision.com/process"
```

### 3. Test Production

```bash
# Merge a main
git checkout main
git merge feature/omr-direct-api
git push origin main

# Verificar en https://profevision.com
```

## Rollback Plan

Si Direct API falla en producción:

### Opción 1: Deshabilitar feature flag (RÁPIDO)

En Vercel Dashboard:
```
NEXT_PUBLIC_USE_DIRECT_OMR=false
```

Redeploy automático → Todos usan legacy API.

### Opción 2: Fallback automático

Ya implementado en código. Si Direct API retorna error, automáticamente usa legacy.

## Monitoreo

### 1. Vercel Logs

```
Dashboard → Deployment → Functions → Logs
```

Buscar errores de fetch a OMR Direct.

### 2. OMR Direct Logs

```bash
ssh servidor
docker logs -f profevision-omr-direct --tail 100
```

### 3. Metrics

- Request count a Direct API
- Latency (debe ser < 2s)
- Error rate (debe ser < 1%)
- Fallback rate (cuántos requests usan fallback)

## Troubleshooting

### Error: CORS blocked

**Síntoma**:
```
Access to fetch at 'https://omr-direct.profevision.com' from origin 'https://profevision.com'
has been blocked by CORS policy
```

**Solución**:
```bash
# Agregar origin a ALLOWED_ORIGINS
vim /path/to/omr-service-direct/.env
docker-compose restart
```

### Error: JWT invalid

**Síntoma**:
```
Direct API failed (401), falling back to legacy
```

**Solución**:
```bash
# Verificar SUPABASE_JWT_SECRET en servidor
# Debe coincidir con proyecto Supabase
```

### Error: Network timeout

**Síntoma**:
```
TypeError: Failed to fetch
```

**Causas posibles**:
- Servidor down
- Firewall bloqueando puerto 8082
- SSL cert expirado

**Solución**:
```bash
# Verificar health
curl https://omr-direct.profevision.com/health

# Verificar nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar docker
docker ps | grep omr-direct
```

## Performance

### Expected Metrics

```
Direct API:
  - Latency: 1-2s
  - Bandwidth saved: ~75% vs legacy
  - Image size: 40-80KB (vs 2-5MB original)

Legacy API (fallback):
  - Latency: 3-5s
  - Bandwidth: ~12MB total (roundtrip via Vercel)
```

## Security

### Checklist

- [x] JWT validation en servidor
- [x] HTTPS only
- [x] CORS origins limitados (no `*`)
- [x] Rate limiting (via nginx)
- [x] Max file size 10MB
- [x] Temp files cleanup
- [x] No PII en logs

## Success Criteria

- [ ] Direct API responde < 2s
- [ ] Error rate < 1%
- [ ] Bandwidth savings > 70%
- [ ] Fallback funciona correctamente
- [ ] Zero downtime durante rollout

---

**Última actualización**: 2025-11-23
**Autor**: Claude Code
