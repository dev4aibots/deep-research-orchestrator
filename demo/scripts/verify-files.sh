#!/usr/bin/env bash
# verify-files.sh — asserts every deliverable file the demo promises exists
# with its key content marker. Prints "Tests N passed (N)"; exits 1 on ANY miss.
set -u
SRC="/home/hatch/workspace/demos/deep-research-orchestrator/demo-src"
PASS=0
FAIL=0

check() { # $1 = name, $2 = file, $3 = required marker
  if [ -f "$2" ] && grep -q -- "$3" "$2"; then
    echo "PASS: $1"; PASS=$((PASS+1))
  else
    echo "FAIL: $1 (missing file or marker)"; FAIL=$((FAIL+1))
  fi
}

check "DESIGN.md (Meta token doc)" \
  "/home/hatch/workspace/demos/deep-research-orchestrator/design/DESIGN.md" \
  "meta-button-primary-bg"

check "globals.css carries the Meta token table" \
  "$SRC/app/globals.css" "--meta-button-primary-bg"

check "fluid type scale vendored" \
  "$SRC/lib/type-scale.ts" "getTypeScale"

check "editorial pipeline diagram" \
  "$SRC/components/orchestrator/HowItWorks.tsx" "How the search works"

check "faithful TS port of the tree search" \
  "$SRC/lib/treesearch.ts" "treeSearch"

check "trace API route" \
  "$SRC/app/api/run/route.ts" "treeSearch"

echo ""
echo "Tests  $PASS passed, $FAIL failed ($((PASS+FAIL)))"
[ "$FAIL" -eq 0 ]
