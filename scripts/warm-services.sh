#!/bin/bash
# ProfeVision - Service Warming Script
# Prevents cold starts by pinging services periodically
# Run this from a cron job or external service like cron-job.org

set -e

echo "🔥 Warming ProfeVision services..."
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""

# Configuration
VERCEL_APP_URL="${VERCEL_APP_URL:-https://your-app.vercel.app}"
LATEX_SERVICE_URL="${LATEX_SERVICE_URL:-https://latex-service.profevision.com}"
OMR_SERVICE_URL="${OMR_SERVICE_URL:-https://omr-service.profevision.com}"

# Function to ping and measure response
ping_service() {
  local name=$1
  local url=$2

  echo -n "Pinging $name... "

  start_time=$(date +%s%3N)
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 5 || echo "000")
  end_time=$(date +%s%3N)

  latency=$((end_time - start_time))

  if [ "$http_code" = "200" ]; then
    echo "✅ OK (${latency}ms)"
    return 0
  else
    echo "❌ FAILED (HTTP $http_code)"
    return 1
  fi
}

# Warm services
failures=0

ping_service "Next.js App Health" "$VERCEL_APP_URL/api/health" || ((failures++))
ping_service "LaTeX Service" "$LATEX_SERVICE_URL/health" || ((failures++))
ping_service "OMR Service" "$OMR_SERVICE_URL/health" || ((failures++))

echo ""
echo "========================================="
if [ $failures -eq 0 ]; then
  echo "✅ All services warmed successfully"
  exit 0
else
  echo "⚠️  $failures service(s) failed"
  exit 1
fi
