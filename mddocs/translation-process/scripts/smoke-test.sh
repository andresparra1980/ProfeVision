#!/bin/bash
# =============================================================================
# Smoke Test - Translation Integration Validator
# =============================================================================
# Validates that a new language has been properly integrated
#
# Usage:
#   ./scripts/smoke-test.sh de
#   ./scripts/smoke-test.sh de --verbose
# =============================================================================

set -e

LANG_CODE=$1
VERBOSE=$2

if [ -z "$LANG_CODE" ]; then
  echo "❌ Error: Language code required"
  echo "Usage: ./scripts/smoke-test.sh <lang> [--verbose]"
  echo "Example: ./scripts/smoke-test.sh de"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PASS_COUNT=0
FAIL_COUNT=0

log() {
  if [ "$VERBOSE" == "--verbose" ]; then
    echo "$1"
  fi
}

check() {
  local description=$1
  local command=$2
  
  if eval "$command" &>/dev/null; then
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "  ✅ $description"
    log "     Command: $command"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "  ❌ $description"
    log "     Command: $command"
    log "     Failed!"
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🔍 Smoke Test - Language: $LANG_CODE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# =============================================================================
# 1. Translation Files
# =============================================================================
echo "📂 Translation Files"
echo "───────────────────────────────────────────────────────────────"

check "UI locales directory exists" \
  "[ -d '$PROJECT_ROOT/apps/web/i18n/locales/$LANG_CODE' ]"

check "API locales directory exists" \
  "[ -d '$PROJECT_ROOT/apps/web/i18n/api/locales/$LANG_CODE' ]"

check "At least 10 UI JSON files" \
  "[ \$(find '$PROJECT_ROOT/apps/web/i18n/locales/$LANG_CODE' -name '*.json' 2>/dev/null | wc -l) -ge 10 ]"

check "At least 10 API JSON files" \
  "[ \$(find '$PROJECT_ROOT/apps/web/i18n/api/locales/$LANG_CODE' -name '*.json' 2>/dev/null | wc -l) -ge 10 ]"

check "At least 5 MDX docs files" \
  "[ \$(find '$PROJECT_ROOT/apps/docs/content/docs' -name '*.$LANG_CODE.mdx' 2>/dev/null | wc -l) -ge 5 ]"

echo ""

# =============================================================================
# 2. Config Files - apps/web
# =============================================================================
echo "⚙️  Config Files - apps/web"
echo "───────────────────────────────────────────────────────────────"

check "i18n/config.ts includes locale" \
  "grep -q \"'$LANG_CODE'\" '$PROJECT_ROOT/apps/web/i18n/config.ts'"

check "i18n/routing.ts includes locale" \
  "grep -q \"'$LANG_CODE'\" '$PROJECT_ROOT/apps/web/i18n/routing.ts'"

check "middleware.ts includes locale" \
  "grep -q \"'$LANG_CODE'\" '$PROJECT_ROOT/apps/web/middleware.ts'"

check "route-constants.ts has mappings" \
  "grep -q \"$LANG_CODE:\" '$PROJECT_ROOT/apps/web/i18n/route-constants.ts'"

echo ""

# =============================================================================
# 3. Config Files - apps/docs
# =============================================================================
echo "📚 Config Files - apps/docs"
echo "───────────────────────────────────────────────────────────────"

check "lib/i18n.ts includes locale" \
  "grep -q \"'$LANG_CODE'\" '$PROJECT_ROOT/apps/docs/lib/i18n.ts'"

check "layout.tsx has translations" \
  "grep -q \"$LANG_CODE:\" '$PROJECT_ROOT/apps/docs/app/[lang]/layout.tsx'"

echo ""

# =============================================================================
# 4. JSON Syntax Validation
# =============================================================================
echo "🔍 JSON Syntax Validation"
echo "───────────────────────────────────────────────────────────────"

# Sample 3 random UI files
SAMPLE_FILES=$(find "$PROJECT_ROOT/apps/web/i18n/locales/$LANG_CODE" -name "*.json" 2>/dev/null | head -3)
for file in $SAMPLE_FILES; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    check "Valid JSON: $filename" \
      "python3 -m json.tool '$file' > /dev/null"
  fi
done

echo ""

# =============================================================================
# 5. Summary
# =============================================================================
echo "═══════════════════════════════════════════════════════════════"
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "📊 Results: $PASS_COUNT/$TOTAL passed"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo "✅ All checks passed! Language $LANG_CODE is ready."
  exit 0
else
  echo "❌ $FAIL_COUNT check(s) failed. Review errors above."
  exit 1
fi
