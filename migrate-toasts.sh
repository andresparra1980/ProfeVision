#!/bin/bash

# Script para migrar llamadas de toast de Radix UI a Sonner
# Este script NO hace cambios automáticos, solo reporta los archivos que necesitan actualización

echo "=== Análisis de migración de toasts a Sonner ==="
echo ""

# Buscar archivos con llamadas a toast()
FILES=$(find app/[locale]/dashboard components -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs grep -l "toast({" 2>/dev/null)

if [ -z "$FILES" ]; then
    echo "✅ No se encontraron archivos con sintaxis antigua de toast"
    exit 0
fi

echo "📋 Archivos que necesitan migración:"
echo "$FILES" | nl
echo ""

# Contar ocurrencias
TOTAL=$(echo "$FILES" | wc -l | tr -d ' ')
echo "📊 Total de archivos: $TOTAL"
echo ""

echo "🔍 Patrones encontrados:"
echo ""

# Buscar patrones específicos
echo "1️⃣ Toasts con variant: 'destructive' (deben convertirse a toast.error()):"
grep -rn "variant: ['\"]destructive['\"]" app/[locale]/dashboard components 2>/dev/null | grep "toast({" -A 3 | head -5
echo ""

echo "2️⃣ Toasts sin variant (deben convertirse a toast.success() o toast()):"  
grep -rn "toast({" app/[locale]/dashboard components 2>/dev/null | grep -v "variant:" | head -5
echo ""

echo "✏️  Patrones de conversión:"
echo ""
echo "  Antiguo (Radix UI):            Nuevo (Sonner):"
echo "  toast({                        toast.error('Title', {"
echo "    variant: 'destructive',        description: 'Message'"
echo "    title: 'Title',              })"
echo "    description: 'Message'"
echo "  })"
echo ""
echo "  toast({                        toast.success('Title', {"
echo "    title: 'Title',                description: 'Message'"
echo "    description: 'Message'       })"
echo "  })"
