# Configuración de Nginx + SSL para el Servicio OMR

Esta guía te ayudará a configurar el servicio OMR con un subdominio seguro usando Nginx y Let's Encrypt.

## 🎯 Resultado Final

- **URL del servicio**: `https://omr-service.profevision.com`
- **Certificado SSL**: Let's Encrypt (gratis, renovación automática)
- **Protocolo**: HTTPS (TLS 1.2/1.3)
- **Rate limiting**: 10 req/s por IP
- **Puerto expuesto**: Solo 80 y 443 (Nginx)

## 📁 Archivos de Configuración de Nginx

Hay **dos archivos** de configuración de Nginx en este directorio:

1. **`nginx-omr-service-precertbot.conf`** ⭐ **USA ESTE PRIMERO**
   - Configuración inicial SIN SSL
   - Úsalo ANTES de ejecutar Certbot
   - Solo escucha en puerto 80 (HTTP)

2. **`nginx-omr-service.conf`** 📖 Solo referencia
   - Configuración completa CON SSL
   - Solo para referencia de cómo se ve después de Certbot
   - **NO lo uses directamente** (causará error porque los certificados no existen todavía)

**Proceso correcto:**
1. Copiar `nginx-omr-service-precertbot.conf` → Nginx
2. Ejecutar Certbot
3. Certbot modifica el archivo automáticamente y agrega SSL
4. El resultado final será similar a `nginx-omr-service.conf`

## 📋 Prerrequisitos

Antes de empezar, asegúrate de tener:

- [x] Servidor Ubuntu 24.04 con acceso SSH
- [x] Docker y Docker Compose instalados
- [x] Acceso a la configuración DNS de `profevision.com`
- [x] Puerto 80 y 443 abiertos en el firewall

## 🚀 Paso 1: Configurar DNS

En tu proveedor de DNS (Cloudflare, GoDaddy, etc.), crea un registro A:

```
Tipo: A
Nombre: omr-service
Valor: [IP_PUBLICA_DE_TU_SERVIDOR]
TTL: Auto o 3600
```

**Verificar que el DNS se propagó:**

```bash
# Desde tu computadora local
dig omr-service.profevision.com

# O usa un servicio online
# https://dnschecker.org
```

Espera a que el DNS se propague (puede tomar de 5 minutos a 24 horas).

## 🔧 Paso 2: Instalar Nginx y Certbot en el Servidor

Conéctate a tu servidor por SSH:

```bash
ssh usuario@tu-servidor.com
```

Instala Nginx y Certbot:

```bash
# Actualizar paquetes
sudo apt-get update

# Instalar Nginx
sudo apt-get install -y nginx

# Instalar Certbot para Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx

# Verificar que Nginx está corriendo
sudo systemctl status nginx

# Habilitar Nginx en el arranque
sudo systemctl enable nginx
```

## 📝 Paso 3: Copiar Configuración Inicial de Nginx (Sin SSL)

**IMPORTANTE:** Usa el archivo `nginx-omr-service-precertbot.conf` que NO tiene las líneas SSL todavía. Certbot las agregará automáticamente después.

En el servidor, ve al directorio del proyecto:

```bash
cd ~/profevision/omr-service
```

Copia la configuración inicial de Nginx (PRE-CERTBOT):

```bash
# Copiar archivo de configuración INICIAL (sin SSL)
sudo cp nginx-omr-service-precertbot.conf /etc/nginx/sites-available/omr-service.profevision.com

# Crear enlace simbólico para habilitar el sitio
sudo ln -s /etc/nginx/sites-available/omr-service.profevision.com /etc/nginx/sites-enabled/

# Verificar que no hay errores de sintaxis
sudo nginx -t
```

**Salida esperada:**

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Si ves este error, es porque usaste el archivo equivocado:
```
cannot load certificate "/etc/letsencrypt/live/omr-service.profevision.com/fullchain.pem"
```
Solución: Usa `nginx-omr-service-precertbot.conf` en lugar de `nginx-omr-service.conf`.

```bash
# Recargar Nginx
sudo systemctl reload nginx
```

## 🔐 Paso 4: Obtener Certificado SSL con Let's Encrypt

**IMPORTANTE:** El DNS debe estar configurado y propagado antes de este paso.

```bash
# Obtener certificado SSL
sudo certbot --nginx -d omr-service.profevision.com

# Certbot te hará algunas preguntas:
# 1. Email (para notificaciones de renovación)
# 2. Términos de servicio (Acepta: Y)
# 3. Compartir email con EFF (Opcional: Y/N)
# 4. Redirect HTTP to HTTPS (Elige: 2 - Redirect)
```

**Salida esperada:**

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/omr-service.profevision.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/omr-service.profevision.com/privkey.pem
```

**¿Qué hace Certbot?**
1. Genera los certificados SSL en `/etc/letsencrypt/live/omr-service.profevision.com/`
2. **Modifica automáticamente** el archivo de Nginx para agregar las líneas SSL
3. Agrega la redirección HTTP → HTTPS
4. Configura renovación automática

**Nota:** Después de que Certbot termine, tu archivo de configuración se verá similar a `nginx-omr-service.conf` (el archivo con SSL completo que está en el repo como referencia).

## 🔄 Paso 5: Recargar Nginx

```bash
# Recargar Nginx para aplicar cambios
sudo systemctl reload nginx

# Verificar estado
sudo systemctl status nginx
```

## 🐳 Paso 6: Instalar y Ejecutar el Servicio OMR

```bash
cd ~/profevision/omr-service

# Configurar variables de entorno
cp .env.example .env
nano .env

# Generar API key
openssl rand -hex 32
# Copia el resultado y pégalo en .env como API_KEY=...

# Instalar servicio systemd
sudo ./install-systemd.sh
```

El script automáticamente:
- ✅ Configura el servicio systemd
- ✅ Habilita auto-start en el arranque
- ✅ Inicia el contenedor Docker
- ✅ Verifica que esté funcionando

## 🔒 Paso 7: Configurar Firewall

```bash
# Permitir SSH (¡IMPORTANTE! No te bloquees)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS (Nginx)
sudo ufw allow 'Nginx Full'

# O manualmente:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

**Salida esperada:**

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

**IMPORTANTE:** NO abras el puerto 8000. El servicio solo debe ser accesible vía Nginx.

## ✅ Paso 8: Verificar que Todo Funciona

### Desde el servidor:

```bash
# Health check local
curl http://localhost:8000/health

# Health check vía Nginx (HTTP)
curl http://omr-service.profevision.com/health

# Health check vía Nginx (HTTPS)
curl https://omr-service.profevision.com/health
```

### Desde tu computadora local:

```bash
# Health check
curl https://omr-service.profevision.com/health

# Ver información del servicio
curl https://omr-service.profevision.com/

# Ver documentación interactiva
# Abre en tu navegador:
https://omr-service.profevision.com/docs
```

### Probar el endpoint de procesamiento:

```bash
curl -X POST https://omr-service.profevision.com/process \
  -H "X-API-Key: tu_api_key" \
  -F "file=@exam_scan.jpg" \
  -F "debug=true"
```

## 📊 Monitoreo y Logs

### Ver logs de Nginx:

```bash
# Logs de acceso
sudo tail -f /var/log/nginx/omr-service.access.log

# Logs de errores
sudo tail -f /var/log/nginx/omr-service.error.log
```

### Ver logs del servicio OMR:

```bash
# Ver logs del contenedor Docker
docker compose -f ~/profevision/omr-service/docker-compose.yml logs -f

# O con systemd
sudo journalctl -u profevision-omr -f
```

### Verificar certificado SSL:

```bash
# Ver información del certificado
sudo certbot certificates

# Ver fecha de expiración
echo | openssl s_client -servername omr-service.profevision.com \
  -connect omr-service.profevision.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

## 🔄 Renovación Automática de Certificados

Let's Encrypt configura automáticamente la renovación. Verificar:

```bash
# Ver timer de renovación
sudo systemctl status certbot.timer

# Probar renovación (dry-run)
sudo certbot renew --dry-run
```

Los certificados se renuevan automáticamente 30 días antes de expirar.

## 🔧 Configuración Avanzada

### Ajustar Rate Limiting

Edita `/etc/nginx/sites-available/omr-service.profevision.com`:

```nginx
# Cambiar de 10 req/s a 20 req/s
limit_req_zone $binary_remote_addr zone=omr_limit:10m rate=20r/s;
```

Recarga Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Aumentar Tamaño Máximo de Upload

Edita `/etc/nginx/sites-available/omr-service.profevision.com`:

```nginx
# Cambiar de 20M a 50M
client_max_body_size 50M;
```

Recarga Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 🔧 Troubleshooting

### Error: "502 Bad Gateway"

```bash
# Verificar que el servicio Docker está corriendo
docker ps | grep profevision-omr

# Verificar que responde en localhost
curl http://localhost:8000/health

# Ver logs
docker compose -f ~/profevision/omr-service/docker-compose.yml logs
```

### Error: "Could not bind to port 80/443"

```bash
# Ver qué proceso está usando el puerto
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Detener Apache si está instalado
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Certificado SSL no se genera

```bash
# Verificar que el DNS apunta al servidor
dig omr-service.profevision.com

# Verificar que el puerto 80 está accesible desde Internet
curl http://omr-service.profevision.com

# Ver logs detallados de Certbot
sudo certbot --nginx -d omr-service.profevision.com --verbose
```

### Nginx no inicia después de cambiar configuración

```bash
# Ver errores
sudo nginx -t

# Ver logs
sudo journalctl -u nginx -n 50
```

## 📚 Configuración en Next.js (Vercel)

En tu aplicación Next.js, configura la URL del servicio:

```env
# .env.production
OMR_SERVICE_URL=https://omr-service.profevision.com
OMR_API_KEY=tu_api_key_generada
```

Ejemplo de uso:

```typescript
// app/api/omr/process/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();

  const response = await fetch(`${process.env.OMR_SERVICE_URL}/process`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.OMR_API_KEY!,
    },
    body: formData,
  });

  return response;
}
```

## 🎉 ¡Listo!

Tu servicio OMR ahora está:
- ✅ Funcionando en `https://omr-service.profevision.com`
- ✅ Protegido con SSL/TLS
- ✅ Con certificado válido y confiable
- ✅ Con rate limiting configurado
- ✅ Con renovación automática de certificados
- ✅ Accesible desde Vercel

## 📝 Comandos Útiles

```bash
# Reiniciar servicio OMR
sudo systemctl restart profevision-omr

# Ver logs del servicio
sudo journalctl -u profevision-omr -f

# Reiniciar Nginx
sudo systemctl restart nginx

# Renovar certificado manualmente
sudo certbot renew

# Ver configuración de Nginx
sudo nginx -T

# Test de SSL
https://www.ssllabs.com/ssltest/analyze.html?d=omr-service.profevision.com
```

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs de Nginx: `/var/log/nginx/omr-service.error.log`
2. Revisa los logs del servicio: `docker compose logs`
3. Verifica el firewall: `sudo ufw status`
4. Verifica el DNS: `dig omr-service.profevision.com`

---

**Documentación creada**: 2025-11-14
**Última actualización**: 2025-11-14
