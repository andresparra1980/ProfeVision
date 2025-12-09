# Nginx Configuration - Correcciones Necesarias

## Problemas en tu configuración actual:

### 1. ❌ Puerto incorrecto
```nginx
# Tu config:
upstream omr_backend_direct {
    server 127.0.0.1:8002;  # ❌ INCORRECTO
}

# Debe ser:
upstream omr_backend_direct {
    server 127.0.0.1:8082;  # ✅ CORRECTO (según docker-compose.yml)
}
```

**Razón**: Docker está configurado para `127.0.0.1:8082:8082` en `docker-compose.yml`

---

### 2. ❌ Zone name inconsistente
```nginx
# Tu config:
limit_req_zone $binary_remote_addr zone=omr_direct_limit:10m rate=10r/s;  # Define omr_direct_limit

location /process {
    limit_req zone=omr_limit burst=20 nodelay;  # ❌ Usa omr_limit (no existe)
}

# Debe ser:
location /process {
    limit_req zone=omr_direct_limit burst=20 nodelay;  # ✅ CORRECTO
}
```

**Razón**: El nombre de la zona debe coincidir

---

### 3. ⚠️ Logs mezclados con legacy
```nginx
# Tu config:
access_log /var/log/nginx/omr-service.access.log;  # ⚠️ Mezcla con legacy
error_log /var/log/nginx/omr-service.error.log;

# Mejor:
access_log /var/log/nginx/omr-direct.access.log;  # ✅ Logs separados
error_log /var/log/nginx/omr-direct.error.log;
```

**Razón**: Facilita debugging y monitoreo separado

---

### 4. ✅ Health check logging
```nginx
# Buena práctica - agregar:
location /health {
    access_log off;  # No llenar logs con health checks
    proxy_pass http://omr_backend_direct;
}
```

---

## Cómo aplicar las correcciones:

### Opción 1: Editar el archivo existente

```bash
sudo vim /etc/nginx/sites-available/omr-direct

# Cambiar:
# - 8002 → 8082 (línea del upstream)
# - omr_limit → omr_direct_limit (línea del location /process)
# - omr-service → omr-direct (líneas de logging)
# - Agregar access_log off; en /health

sudo nginx -t
sudo systemctl reload nginx
```

### Opción 2: Usar el archivo corregido

```bash
# Desde el worktree
cd /path/to/omr-direct-api/omr-service-direct

# Copiar archivo corregido
sudo cp nginx-site-production.conf /etc/nginx/sites-available/omr-direct

# Verificar y recargar
sudo nginx -t
sudo systemctl reload nginx
```

---

## Verificación post-aplicación:

```bash
# 1. Verificar que nginx usa el puerto correcto
sudo nginx -T | grep -A5 "omr_backend_direct"
# Debe mostrar: server 127.0.0.1:8082;

# 2. Test health check
curl http://localhost/health
# O después de certbot:
curl https://omr-direct.profevision.com/health

# 3. Verificar logs
sudo tail -f /var/log/nginx/omr-direct.access.log
sudo tail -f /var/log/nginx/omr-direct.error.log
```

---

## Configuración correcta completa:

Ver: `nginx-site-production.conf` en este directorio.

Después de certbot, nginx agregará automáticamente el bloque SSL:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name omr-direct.profevision.com;

    ssl_certificate /etc/letsencrypt/live/omr-direct.profevision.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/omr-direct.profevision.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... resto de la config
}
```

---

## Resumen de cambios requeridos:

- [ ] Cambiar puerto `8002` → `8082`
- [ ] Corregir zone name `omr_limit` → `omr_direct_limit`
- [ ] Cambiar logs `omr-service` → `omr-direct`
- [ ] Agregar `access_log off;` en `/health`
- [ ] Verificar con `nginx -t`
- [ ] Reload nginx
- [ ] Test health endpoint
