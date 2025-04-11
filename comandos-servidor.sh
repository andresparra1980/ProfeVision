#!/bin/bash
# Comandos para corregir permisos y reiniciar Nginx en el servidor de producción

# 1. Copiar el archivo de configuración de Nginx
echo "Copiando archivo de configuración..."
sudo cp nginx-serve-uploads.conf /etc/nginx/snippets/serve-uploads.conf

# 2. Verificar permisos del directorio de uploads
echo "Verificando y corrigiendo permisos del directorio de uploads..."
sudo chown -R www-data:www-data /home/andresparra/ProfeVision/public/uploads/omr/
sudo chmod -R 755 /home/andresparra/ProfeVision/public/uploads/omr/

# 3. Verificar que Nginx tenga acceso al directorio
echo "Dando permisos de ejecución a los directorios padres..."
sudo chmod +x /home/andresparra
sudo chmod +x /home/andresparra/ProfeVision
sudo chmod +x /home/andresparra/ProfeVision/public
sudo chmod +x /home/andresparra/ProfeVision/public/uploads

# 4. Verificar que www-data pueda acceder al directorio de inicio del usuario
echo "Verificando permisos del directorio home..."
sudo ls -la /home/andresparra
if [ $? -ne 0 ]; then
    echo "ERROR: Nginx (www-data) no puede acceder a /home/andresparra"
    echo "Considera mover los archivos a /var/www/profevision/uploads/omr/"
fi

# 5. Opción alternativa: Crear un enlace simbólico en un directorio accesible
echo "Creando enlace simbólico en /var/www (alternativa)..."
sudo mkdir -p /var/www/profevision/uploads/omr
sudo ln -sf /home/andresparra/ProfeVision/public/uploads/omr/* /var/www/profevision/uploads/omr/
sudo chown -R www-data:www-data /var/www/profevision
sudo chmod -R 755 /var/www/profevision

# 6. Editar el archivo de configuración si se usa el enlace simbólico
echo "Nota: Si decides usar el enlace simbólico, edita /etc/nginx/snippets/serve-uploads.conf"
echo "y cambia la línea 'alias /home/andresparra/ProfeVision/public/uploads/omr/;'"
echo "a 'alias /var/www/profevision/uploads/omr/;'"

# 7. Verificar la configuración de Nginx
echo "Verificando la configuración de Nginx..."
sudo nginx -t

# 8. Reiniciar Nginx
echo "Reiniciando Nginx..."
sudo systemctl restart nginx

# 9. Verificar el estado de Nginx
echo "Verificando el estado de Nginx..."
sudo systemctl status nginx

# 10. Verificar logs para detectar errores
echo "Verificando logs de error de Nginx..."
sudo tail -n 50 /var/log/nginx/error.log
sudo tail -n 50 /var/log/nginx/uploads-error.log

echo "Proceso completado. Verifica que puedas acceder a las imágenes ahora." 