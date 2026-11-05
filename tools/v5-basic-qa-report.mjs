// Run only after the package/browser checks. The generated artifact carries the
// exact source and archive hashes without a self-referential documentation SHA.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
execFileSync('git',['diff','--exit-code','HEAD','--','v5','tools/coast-crazygames.mjs']);
const zip='dist/vaultwake-coast-crazygames.zip',hash=createHash('sha256').update(readFileSync(zip)).digest('hex');
const basic=readFileSync('dist/coast-crazygames/v5/coast-crazygames.html','utf8');
assert.match(basic,/data-ads="off"/);assert.match(basic,/data-launch="basic"/);
assert.equal(basic,readFileSync('v5/coast-crazygames.html','utf8'));
const payload=readFileSync('dist/basic-initial-download.jsonl','utf8').trim().split('\n').filter(l=>l.startsWith('{')).map(l=>JSON.parse(l));
assert.equal(payload.length,6,'all three real engines and both payload viewports must execute');
assert.deepEqual(new Set(payload.map(r=>r.engine)),new Set(['chromium','webkit','firefox']));
for(const engine of ['chromium','webkit','firefox'])assert.deepEqual(payload.filter(r=>r.engine===engine).map(r=>r.viewport).sort(),['390x844','907x510']);
for(const r of payload)assert.ok(Number.isFinite(r.initialBytes)&&r.initialBytes>0&&r.initialBytes<=r.limitMB*1048576);
const run=process.env.GITHUB_RUN_ID?`https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`:'UNVERIFIED — no CI run context';
const text=`# Vaultwake V5 — exact-head Basic package QA\n\nSource SHA: \`${head}\`\n\nZIP: \`${zip}\`\n\nSHA-256: \`${hash}\`\n\nExecution evidence: ${run}\n\nThis report is generated after the same job successfully checks page generation, ZIP integrity, extracted Basic Chromium/WebKit/Firefox browser smoke, initial-download limits and the separate Full SDK-stub reward smoke. It is a QA candidate, not publication approval.\n\n| Engine | Viewport | Initial bytes | Limit MiB |\n| --- | --- | ---: | ---: |\n${payload.map(r=>`| ${r.engine} | ${r.viewport} | ${r.initialBytes} | ${r.limitMB} |`).join('\n')}\n\nBasic configuration is ads-off and matches the committed page. No interstitial or rewarded-ad offer is enabled in this archive. SDK callbacks in these tests are stubs; production SDK/ad acceptance is **UNVERIFIED**.\n\nPhysical iPhone Safari, Android Chrome, browser chrome/safe-area behavior on hardware, device audio/haptics, CrazyGames portal acceptance, art/title commercial clearance and real-player retention are **UNVERIFIED**. Headless emulation and paced scripted play do not establish player retention.\n\nSee the Draft PR for the independent rule, mobile first-session and Chapter 1–6 CI results, before/after screenshots and device checklist. No production publication or merge is authorized by this report.\n`;
writeFileSync('dist/BASIC-QA-REPORT.md',text);console.log('Exact-head Basic QA report:',head,hash);
