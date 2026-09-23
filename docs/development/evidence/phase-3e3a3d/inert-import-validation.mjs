import assert from 'node:assert/strict';import {readdirSync} from 'node:fs';
const paths=readdirSync('/proposal').sort();const handles=process._getActiveHandles().length;const resources=process.getActiveResourcesInfo();
process.argv[2]='--separately-authorized-a4-guard';
await import('./proposed-redirect-guard.mjs');await import('./proposed-public-health.mjs');await import('./proposed-idle-runtime.mjs');await import('./public-guard-tests.mjs');
assert.equal(process._getActiveHandles().length,handles);assert.deepEqual(process.getActiveResourcesInfo(),resources);assert.deepEqual(readdirSync('/proposal').sort(),paths);
console.log(JSON.stringify({inertImports:true,handlesUnchanged:true,resourcesUnchanged:true,filesUnchanged:true}));
process.argv[2]='--public-guard-tests';await (await import('./public-guard-tests.mjs')).main();
