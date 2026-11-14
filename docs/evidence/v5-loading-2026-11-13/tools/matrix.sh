#!/bin/bash
# usage: matrix.sh <tag>  → results-<tag>.txt (median lines per config)
cd "$(dirname "$0")";export NODE_PATH=$(npm root -g);T=$1;PORT=${2:-8443};: > results-$T.txt
run(){ local name=$1;shift;local base;if echo "$@"|grep -q PAGE=cg;then base=https://127.0.0.1:$PORT;else base=https://127.0.0.1:$PORT;fi;echo "== $name" >> results-$T.txt; env BASE=$base "$@" timeout 900 node measure.cjs "$T-$name" 3 2>&1 | grep -E "MEDIAN|Error|error" >> results-$T.txt; }
run play-new-slow4g PROFILE=slow4g
run play-ret-slow4g PROFILE=slow4g SEED=returning
run cg-new-slow4g PROFILE=slow4g PAGE=cg
run cg-ret-slow4g PROFILE=slow4g PAGE=cg SEED=returning
run play-new-4g PROFILE=4g
run cg-new-4g PROFILE=4g PAGE=cg
run play-new-slow4g-warm PROFILE=slow4g WARM=1
run play-ret-slow4g-warm PROFILE=slow4g SEED=returning WARM=1
echo DONE >> results-$T.txt
