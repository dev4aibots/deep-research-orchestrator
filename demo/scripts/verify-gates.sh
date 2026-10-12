#!/usr/bin/env bash
# verify-gates.sh — design + regression gates for the deep-research-orchestrator demo.
# Runs every check, prints PASS/FAIL per check, then a final "Tests N passed (N)"
# summary line (parsed by the upheld verifier). Exits 1 on ANY failure.
set -u
SRC="/home/hatch/workspace/demos/deep-research-orchestrator/demo-src"
PASS=0
FAIL=0

check() { # $1 = name, $2.. = command
  local name="$1"; shift
  if "$@" > /tmp/gate-out.log 2>&1; then
    echo "PASS: $name"; PASS=$((PASS+1))
  else
    echo "FAIL: $name"; tail -5 /tmp/gate-out.log | sed 's/^/    /'; FAIL=$((FAIL+1))
  fi
}

cd "$SRC"

check "tsc --noEmit" npx tsc --noEmit

check "seeded determinism" npx tsx -e \
  "import('./lib/treesearch.ts').then(m=>{const ser=r=>JSON.stringify({e:r.events,n:[...r.nodes.entries()]});const a=ser(m.treeSearch('s',{rngSeed:7}));const b=ser(m.treeSearch('s',{rngSeed:7}));if(a!==b){process.exit(1)}console.log('deterministic OK')})"

check "zero secrets in source" bash -c \
  "! grep -riE 'api[_-]?key|apikey|bearer|BEGIN.*PRIVATE' '$SRC/app' '$SRC/lib' '$SRC/components' --include='*.ts' --include='*.tsx'"

check "DESIGN.md exists + Meta token present" bash -c \
  "test -f /home/hatch/workspace/demos/deep-research-orchestrator/design/DESIGN.md && grep -q -- '--meta-button-primary-bg' '$SRC/app/globals.css'"

check "anti-slop gate" bash -c \
  "rm -rf /tmp/slop-gate && mkdir -p /tmp/slop-gate && cp -r '$SRC/app' '$SRC/components' '$SRC/lib' /tmp/slop-gate/ && cp '$SRC/PORT_NOTES.md' '$SRC/package.json' '$SRC/tsconfig.json' /tmp/slop-gate/ && bash /home/hatch/workspace/demos/design-overhaul/research/tooling/anti-slop-check.sh /tmp/slop-gate"

check "stylelint" npx stylelint "app/**/*.css"

check "contrast (10 pairs, WCAG AA)" bash -c "
  cd '$SRC' &&
  for pair in '#050505 #ffffff' '#65676B #ffffff' '#ffffff #0866FF' '#0064D1 #EBF5FF' '#050505 #F4F2EE' '#65676B #F4F2EE' '#65676B #FAF8F4' '#050505 #DEEFE1' '#050505 #FDE9EC' '#C92A33 #ffffff'; do
    set -- \$pair
    npx ccr \"\$1\" \"\$2\" --level AA || exit 1
  done"

check "tailwind-a11y" npx tailwind-a11y 'app/**/*.{tsx,jsx}' 'components/**/*.{tsx,jsx}'

check "oxlint (0 errors)" bash -c "cd '$SRC' && npx oxlint app components lib 2>&1 | grep -q '0 errors'"

echo ""
echo "Tests  $PASS passed, $FAIL failed ($((PASS+FAIL)))"
[ "$FAIL" -eq 0 ]
