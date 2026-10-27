import assert from 'node:assert/strict';
import { createServer } from 'vite';

// Regresión: un build correcto no detectaba el import de public/ en desarrollo.
const server = await createServer({ server:{ host:'127.0.0.1', port:0, hmr:false }, optimizeDeps:{ noDiscovery:true, include:[] }, logLevel:'error' });
try {
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  for (const file of ['landing/LandingPage.jsx', 'other/LegalTerms.jsx', 'other/PublicPackages.jsx']) {
    const response = await fetch(`${origin}/src/pages/${file}`);
    assert.equal(response.status,200,file);
    const code = await response.text();
    assert(code.includes('/src/utils/marketingRuntime.mjs'),file);
    assert(!code.includes('vite-ignore'),file);
  }
  const response = await fetch(`${origin}/src/utils/marketingRuntime.mjs`);
  assert.equal(response.status,200);
  assert((await response.text()).includes('mountMarketing'));
  const catalogRuntime = await fetch(`${origin}/src/utils/catalogRuntime.mjs`);
  assert.equal(catalogRuntime.status,200);
  assert((await catalogRuntime.text()).includes('mountCatalog'));
  const verification = await fetch(`${origin}/google7e9bcb6a75203673.html`);
  assert.equal(verification.status,200);
  assert.equal(await verification.text(),'google-site-verification: google7e9bcb6a75203673.html');
  console.log('PASS: Vite dev sirve las tres vistas y su módulo sin importar archivos de public.');
} finally { await server.close(); }
