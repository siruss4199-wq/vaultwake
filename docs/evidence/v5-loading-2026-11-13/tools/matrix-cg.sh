#!/bin/bash
cd "$(dirname "$0")";export NODE_PATH=$(npm root -g);T=$1;PORT=$2;: > results-$T-cg.txt
run(){ local name=$1;shift;echo "== $name" >> results-$T-cg.txt; env BASE=https://127.0.0.1:$PORT "$@" timeout 900 node measure.cjs "$T-$name" 3 2>&1 | grep -E "MEDIAN|Error|error" >> results-$T-cg.txt; }
run cg-new-slow4g PROFILE=slow4g PAGE=cg
run cg-ret-slow4g PROFILE=slow4g PAGE=cg SEED=returning
run cg-new-4g PROFILE=4g PAGE=cg
echo DONE >> results-$T-cg.txt
