### CONFIGURACION NGINX

/etc/nginx/sites-available/profevision

```conf
server {
    listen 80;
    listen [::]:80;
    server_name profevision.com www.profevision.com; # Include all domains
    include snippets/serve-uploads.conf; # Still might be useful for other 80 handling

    # Redirect any remaining HTTP traffic that isn't handled by Cloudflare
    # (e.g., direct access to your IP, or if Cloudflare mode changes)
    return 301 https://$host$request_uri;

    # REMOVE THE LOCATION BLOCKS FROM HERE
    # They are not needed if Cloudflare sends traffic to 443
    # location /_next/static/ { ... }
    # location / { ... }
}


server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name profevision.com www.profevision.com; # Add profevision.andresparra.co back if needed
    include snippets/serve-uploads.conf;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/profevision.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/profevision.com/privkey.pem; # managed by Certbot

    # ... (rest of your SSL configuration remains the same) ...
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Performance optimizations
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 100 8k;

    # Increase timeouts
    proxy_connect_timeout 60s;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;

    # Static files
    location /_next/static/ {
        alias /var/www/profevision/_next/static/;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";

        # Ensure proper MIME types
        include /etc/nginx/mime.types;
        default_type application/octet-stream;
    }

    # Handle all other requests with the Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Ssl on;
    }
}

/etc/nginx/snippets/serve-uploads.conf 

```conf
# Configuración para servir archivos estáticos desde uploads
# Guardar este archivo en /etc/nginx/snippets/serve-uploads.conf

# Servir archivos de uploads/omr directamente
location /uploads/omr/ {
    alias /home/andresparra/ProfeVision/public/uploads/omr/;
    
    # Asegurar acceso
    autoindex off;
    
    # Permitir métodos necesarios
    limit_except GET {
        deny all;
    }
    
    # Configuración de caché para imágenes
    expires 1d;
    add_header Cache-Control "public, max-age=86400";
    
    # Tipos MIME para imágenes
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Aumentar buffer para archivos grandes
    client_max_body_size 10M;
    
    # Acceso y registro
    access_log /var/log/nginx/uploads-access.log;
    error_log /var/log/nginx/uploads-error.log;
}

# Desactivar acceso a .git y otros directorios sensibles
location ~ /\.(git|svn|hg) {
    deny all;
    return 404;
}
```
