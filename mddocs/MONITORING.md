# ProfeVision - Guía de Monitoreo y Límites de Vercel

## 📊 Límites de Vercel Free Tier

### Límites Críticos

| Recurso | Free Tier | Pro Tier | Impacto |
|---------|-----------|----------|---------|
| **Function Execution Timeout** | **10s** | 60s | ⚠️ CRÍTICO - LaTeX puede tardar 30-60s |
| **Invocations** | 100 GB-Hrs/mes | 1000 GB-Hrs/mes | Moderado |
| **Bandwidth** | 100 GB/mes | 1 TB/mes | PDFs pesan, vigilar |
| **Edge Requests** | Ilimitado | Ilimitado | ✅ OK |
| **Concurrent Executions** | ~10 | Sin límite | Throttling posible |

### Cálculo de GB-Hours

```
GB-Hours = (Memoria en GB) × (Duración en horas) × (# invocaciones)

Ejemplo con 1000 compilaciones LaTeX:
1024 MB × 10s × 1000 = 1 GB × 0.00278 hrs × 1000 = 2.78 GB-Hrs ✅
```

## ⚠️ Problemas a Vigilar

### 1. Timeout en Free Tier (10 segundos)

**Problema:** Compilaciones LaTeX complejas pueden tardar más de 10s

**Detección:**
- Error en Vercel logs: `FUNCTION_INVOCATION_TIMEOUT`
- Status 504 Gateway Timeout
- Usuario no recibe PDF

**Solución:**
```typescript
// Ya implementado en app/api/latex/compile/route.ts
export const maxDuration = 10; // Declara el límite explícitamente
```

**Mitigación:**
- Optimizar código LaTeX (menos paquetes, documentos simples)
- Monitorear tiempos de compilación
- Considerar Pro tier si > 10s es común
- Agregar caché de PDFs generados (Supabase Storage)

### 2. Latencia de Red (Vercel → Microservicios)

**Problema:** Vercel (global) → Hetzner (Alemania) agrega latencia

**Latencia típica:**
```
Vercel US East → Hetzner Germany: ~100-150ms
Vercel EU → Hetzner Germany: ~20-50ms
+ Microservice processing time
+ Response transfer time
```

**Solución:**
- Monitorear latencias end-to-end
- Configurar Vercel region más cercana (EU en este caso)
- Considerar CDN para assets estáticos

### 3. Cold Starts

**Problema:** Funciones duermen después de inactividad, primera request es lenta

**Detección:**
- Primera request: 2-5s
- Requests subsecuentes: < 500ms

**Solución:** Warming periódico (ver script)

### 4. Bandwidth Exhaustion

**Problema:** PDFs grandes + muchos usuarios = bandwidth

**Cálculo:**
```
100 GB/mes ÷ 50 KB/PDF = ~2 millones de PDFs ✅

Pero si son 500 KB/PDF:
100 GB/mes ÷ 500 KB = ~200,000 PDFs/mes
= ~6,666 PDFs/día
= ~277 PDFs/hora
```

**Monitorear:** Vercel Dashboard → Usage → Bandwidth

## 🛠️ Servicios de Monitoreo GRATIS

### 1. UptimeRobot ⭐ RECOMENDADO

**Por qué:**
- ✅ 50 monitores gratis
- ✅ Checks cada 5 minutos
- ✅ Alertas: Email, SMS, Slack, Discord, Telegram
- ✅ Public status page
- ✅ SSL certificate monitoring
- ✅ Keyword monitoring

**Setup:**

1. **Crear cuenta:** https://uptimerobot.com/

2. **Agregar monitores:**

```
Monitor 1: ProfeVision App Health
- Type: HTTP(s)
- URL: https://your-app.vercel.app/api/health
- Keyword Alert: "healthy"
- Interval: 5 minutes

Monitor 2: LaTeX Microservice
- Type: HTTP(s)
- URL: https://latex-service.profevision.com/health
- Keyword Alert: "healthy"
- Interval: 5 minutes

Monitor 3: OMR Microservice
- Type: HTTP(s)
- URL: https://omr-service.profevision.com/health
- Keyword Alert: "healthy"
- Interval: 5 minutes

Monitor 4: Supabase Database (opcional)
- Type: Ping
- URL: your-project.supabase.co
- Interval: 5 minutes
```

3. **Configurar alertas:**
   - Alert Contacts → Add → Email/SMS
   - Notification settings: Alert when down (2 checks)
   - Re-alert every: 30 minutes

4. **Public Status Page:**
   - My Settings → Add Public Status Page
   - URL personalizada: status.profevision.com (configurable con CNAME)
   - Compartir con usuarios: "Ver estado del sistema"

### 2. BetterStack (Better Uptime)

**Ventajas:**
- ✅ 10 monitores gratis
- ✅ Checks cada **30 segundos** (más frecuente!)
- ✅ On-call scheduling
- ✅ Incident management
- ✅ Phone call alerts

**Setup:** https://betterstack.com/

Similar a UptimeRobot pero más frecuente (30s vs 5min)

### 3. Freshping

**Ventajas:**
- ✅ 50 checks gratis
- ✅ Checks cada **1 minuto**
- ✅ 5 public status pages
- ✅ Unlimited team members

**Setup:** https://www.freshworks.com/website-monitoring/

### 4. Cron-Job.org (Warming Service)

**Para prevenir cold starts:**

1. Crear cuenta: https://cron-job.org/
2. Create Cronjob:
   - Title: "Warm ProfeVision Services"
   - URL: `https://your-app.vercel.app/api/health`
   - Schedule: Every 5 minutes
   - Enable: ✅

Esto "despierta" tu app cada 5 minutos = sin cold starts

## 📈 Métricas a Monitorear

### 1. Vercel Analytics (Built-in)

**Dashboard:** https://vercel.com/dashboard → Analytics

**Métricas clave:**
- **Real Experience Score (RES)** - Experiencia del usuario
- **Core Web Vitals:**
  - LCP (Largest Contentful Paint) - < 2.5s
  - FID (First Input Delay) - < 100ms
  - CLS (Cumulative Layout Shift) - < 0.1
- **Invocations** - Uso de funciones serverless
- **Bandwidth** - Transferencia de datos

### 2. Logs de Vercel

**Búsquedas útiles:**

```bash
# Timeouts
filter: "FUNCTION_INVOCATION_TIMEOUT"

# Errores 5xx
filter: status:500..599

# Requests lentas (> 5s)
filter: duration:5000..

# Microservice failures
filter: "LaTeX compilation failed" OR "OMR processing failed"
```

### 3. Microservices Logs

**SSH al servidor:**

```bash
# LaTeX service logs
docker logs profevision-latex --tail 100 -f

# OMR service logs
docker logs profevision-omr --tail 100 -f

# Filtrar errores
docker logs profevision-latex 2>&1 | grep -i error

# Filtrar por tiempo de compilación
docker logs profevision-latex 2>&1 | grep "time="
```

## 🚀 Script de Warming (Prevenir Cold Starts)

**Ubicación:** `scripts/warm-services.sh`

**Uso local:**

```bash
# Configurar URLs
export VERCEL_APP_URL="https://your-app.vercel.app"
export LATEX_SERVICE_URL="https://latex-service.profevision.com"
export OMR_SERVICE_URL="https://omr-service.profevision.com"

# Ejecutar
./scripts/warm-services.sh
```

**Configurar en Cron-Job.org:**

1. Subir script a GitHub
2. Crear endpoint en tu app que ejecute el warming
3. O usar directamente las URLs de health check

**Alternativa: GitHub Actions**

```yaml
# .github/workflows/warm-services.yml
name: Warm Services
on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
  workflow_dispatch: # Manual trigger

jobs:
  warm:
    runs-on: ubuntu-latest
    steps:
      - name: Warm Vercel App
        run: curl -f https://your-app.vercel.app/api/health

      - name: Warm LaTeX Service
        run: curl -f https://latex-service.profevision.com/health

      - name: Warm OMR Service
        run: curl -f https://omr-service.profevision.com/health
```

## 📊 Dashboard Recomendado

### Opción 1: UptimeRobot Status Page

- URL pública compartible
- Muestra uptime 24h/7d/30d/90d
- Tiempos de respuesta promedio
- Incidentes históricos
- **Ejemplo:** https://stats.uptimerobot.com/xxx

### Opción 2: Grafana + Prometheus (Avanzado)

Para métricas más detalladas:

1. **Prometheus** - Scraping de métricas de microservices
2. **Grafana** - Dashboards visuales
3. **Grafana Cloud Free Tier** - 10k series, 50GB logs, 50GB traces

**Setup básico:**

```yaml
# docker-compose.yml (agregar a microservices)
services:
  latex-service:
    # ... existing config
    labels:
      - "prometheus.scrape=true"
      - "prometheus.port=8001"
```

## 🔔 Alertas Recomendadas

### Críticas (Pager/SMS)

1. **Servicio caído > 2 minutos**
   - LaTeX service down
   - OMR service down
   - App principal down

2. **Error rate > 10%**
   - Más de 10% de requests fallan

### Warnings (Email/Slack)

1. **Latencia alta > 5s**
   - Tiempos de respuesta anormalmente altos

2. **Uptime < 99.5% en 24h**
   - Degradación del servicio

3. **Bandwidth > 80% del límite**
   - Acercándose al límite mensual

## 📝 Checklist de Producción

- [ ] Health check endpoint creado (`/api/health`)
- [ ] UptimeRobot configurado con 3 monitores
- [ ] Alertas por email configuradas
- [ ] Public status page creada
- [ ] Warming service configurado (Cron-Job.org)
- [ ] `maxDuration = 10` en todas las routes
- [ ] Vercel Analytics revisado semanalmente
- [ ] Logs monitoreados diariamente
- [ ] Bandwidth usage revisado semanalmente

## 🆘 Troubleshooting

### "Function Execution Timeout"

**Causas:**
1. LaTeX compilation > 10s
2. Microservice no responde
3. Network latency alta

**Diagnóstico:**
```bash
# Probar localmente cuánto tarda
time curl -X POST https://latex-service.profevision.com/compile \
  -H "X-API-Key: xxx" \
  -H "Content-Type: application/json" \
  -d '{"tex":"...","job_name":"test"}' \
  -o test.pdf
```

**Soluciones:**
- Optimizar LaTeX (menos paquetes)
- Cachear PDFs comunes
- Upgrade a Pro tier ($20/mes)

### "Invocations Limit Exceeded"

**Cálculo actual:**
```
100 GB-Hrs/mes ÷ 1 GB ÷ 10s = ~36,000 compilaciones/mes
= ~1,200/día
= ~50/hora
```

**Si excedes:**
- Implementar caché de PDFs
- Rate limiting por usuario
- Upgrade a Pro tier

### "Bandwidth Limit Exceeded"

**Reducir uso:**
1. Comprimir PDFs con Ghostscript
2. Cachear en Supabase Storage
3. CDN para assets (Cloudflare)
4. Upgrade a Pro tier

## 📚 Referencias

- [Vercel Limits](https://vercel.com/docs/platform/limits)
- [Next.js maxDuration](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration)
- [UptimeRobot Docs](https://uptimerobot.com/api/)
- [BetterStack Docs](https://betterstack.com/docs)

---

**Última actualización:** 2025-11-15
