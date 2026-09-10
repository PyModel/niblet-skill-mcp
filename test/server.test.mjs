import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.mjs';

const TOKEN = 'private-test-token-canary';
const MEDIA_ORIGIN = 'https://media.niblet.com';
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);
const tools = [
  ['find_ui_references', { query: 'checkout', platform: 'ios', limit: 3 }, '/v1/search', { q: 'checkout', platform: 'ios', limit: '3' }],
  ['find_ui_materials', { query: 'navigation', kind: 'icon', limit: 2 }, '/v1/materials', { q: 'navigation', kind: 'icon', limit: '2' }],
  ['get_design_reference', { screenId: 'screen-1' }, '/v1/design-reference', { screenId: 'screen-1' }],
];

const DESIGN_MD = '# Bank — Style Reference\n> Calm ledger blue\n\n**Theme:** light\n\n## Tokens — Colors\n\n| Name | Value |\n| --- | --- |\n| Ledger | `#123456` |\n';

function ref(overrides = {}) {
  return {
    id: 'screen-1',
    app: 'Bank',
    platform: 'ios',
    screenType: 'settings',
    summary: 'A settings screen.',
    width: 1170,
    height: 2532,
    thumbUrl: `${MEDIA_ORIGIN}/thumb/a/1.webp`,
    inspectUrl: `${MEDIA_ORIGIN}/inspect/a/1.webp`,
    ...overrides,
  };
}

function imageResponse(bytes = PNG, type = 'image/webp') {
  return new Response(bytes, { headers: { 'content-type': type } });
}

async function connect(t, options) {
  const server = createServer({ mediaOrigin: MEDIA_ORIGIN, ...options });
  const client = new Client({ name: 'niblet-boundary-test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

const SAFE_ERRORS = [
  /^NIBLET_TOKEN is /,
  /^Niblet API (authentication failed|access denied|rate limit|is unavailable|request failed|redirects|returned|could not be reached|request timed out|request was cancelled|response exceeded)/,
  /^The requested Niblet resource was not found/,
  /^(MCP error|Invalid arguments|Tool .* not found)/,
];

function assertSafeError(result) {
  assert.equal(result.isError, true);
  assert.ok(result.content.length > 0, 'an error result must carry a message');
  assert.ok(result.content.every((item) => item.type === 'text'));
  const serialized = JSON.stringify(result);
  for (const leak of [TOKEN, Buffer.from(TOKEN).toString('base64'), encodeURIComponent(TOKEN), TOKEN.slice(8)]) {
    assert.equal(serialized.includes(leak), false, `credentials must not escape (${leak.slice(0, 12)}…)`);
  }
  for (const item of result.content) {
    assert.ok(SAFE_ERRORS.some((pattern) => pattern.test(item.text)),
      `error text must be one of the known sanitized messages, got: ${item.text.slice(0, 120)}`);
  }
}

test('the advertised server version is the package version', async (t) => {
  const { default: pkg } = await import('../package.json', { with: { type: 'json' } });
  const client = await connect(t, { token: TOKEN, fetch: async () => Response.json({}) });
  assert.equal(client.getServerVersion().version, pkg.version);
});

test('the server exposes the two hosted tools, the local helpers, and every bundled document', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async () => Response.json({}) });
  const { tools: listed } = await client.listTools();
  assert.deepEqual(listed.map((tool) => tool.name).sort(), ['find_ui_materials', 'find_ui_references', 'get_design_reference', 'niblet_help', 'niblet_status']);
  const { resources } = await client.listResources();
  assert.deepEqual(resources.map((resource) => resource.uri).sort(), [
    'niblet://skill',
    'niblet://skill/commands',
    'niblet://skill/connection',
    'niblet://skill/evidence',
    'niblet://skill/native',
  ]);
  const { contents } = await client.readResource({ uri: 'niblet://skill' });
  assert.match(contents[0].text, /^---\nname: niblet\n/);
  for (const uri of ['niblet://skill/commands', 'niblet://skill/connection', 'niblet://skill/evidence', 'niblet://skill/native']) {
    const doc = await client.readResource({ uri });
    assert.ok(doc.contents[0].text.length > 0, `${uri} must serve content`);
  }
});

test('bundled documents link to each other by resource URI, not by unresolvable relative path', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async () => Response.json({}) });
  for (const uri of ['niblet://skill', 'niblet://skill/commands', 'niblet://skill/native']) {
    const { contents } = await client.readResource({ uri });
    assert.doesNotMatch(contents[0].text, /\]\((?:\.\.\/)?(?:references\/)?[a-z]+\.md\)/,
      `${uri} still points at a path an MCP client cannot open`);
  }
  const { contents } = await client.readResource({ uri: 'niblet://skill' });
  assert.match(contents[0].text, /\]\(niblet:\/\/skill\/commands\)/);
});

test('niblet_help lists every command and needs no token', async (t) => {
  let requests = 0;
  const client = await connect(t, { token: '', fetch: async () => { requests++; return Response.json({}); } });
  const result = await client.callTool({ name: 'niblet_help', arguments: {} });
  const text = result.content.map((item) => item.text).join('\n');
  assert.equal(requests, 0, 'help must not reach the network');
  assert.equal(result.isError, undefined);
  for (const command of ['craft', 'polish', 'critique', 'harden', 'doctor']) {
    assert.match(text, new RegExp(`\\b${command}\\b`), `help must list ${command}`);
  }
  assert.match(text, /Persuade/, 'help must list the surface modes');
  assert.match(text, /niblet:\/\/skill\/commands/, 'help must point at the full playbook');
});

test('niblet_help resolves a single command and rejects an unknown one', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async () => Response.json({}) });
  const found = await client.callTool({ name: 'niblet_help', arguments: { command: 'polish' } });
  assert.match(found.content[0].text, /`polish` — remove visible inconsistency/);
  const missing = await client.callTool({ name: 'niblet_help', arguments: { command: 'nonexistent' } });
  assert.match(missing.content[0].text, /No Niblet command named/);
});

test('niblet_status reports a missing token without contacting the API or echoing it', async (t) => {
  let requests = 0;
  const client = await connect(t, { token: '', fetch: async () => { requests++; return Response.json({}); } });
  const result = await client.callTool({ name: 'niblet_status', arguments: {} });
  assert.equal(requests, 0);
  assert.match(result.content[0].text, /Token:\s+not configured/);
});

test('niblet_status never echoes the token and surfaces an unreachable API', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async () => { throw new Error('connect ECONNREFUSED'); } });
  const result = await client.callTool({ name: 'niblet_status', arguments: {} });
  const text = result.content.map((item) => item.text).join('\n');
  assert.equal(text.includes(TOKEN), false, 'status must not echo the token');
  assert.match(text, /Token:\s+present \(\d+ characters, not shown\)/);
  assert.match(text, /API check:\s+FAILED/);
});

test('niblet_status treats an answered request as reachable, not a failure', async (t) => {
  // /v1/stats is not part of the hosted contract; a 404 there is a healthy deployment.
  const client = await connect(t, { token: TOKEN, fetch: async () => new Response('', { status: 404 }) });
  const notFound = await client.callTool({ name: 'niblet_status', arguments: {} });
  assert.match(notFound.content[0].text, /API check:\s+reachable/);
  assert.doesNotMatch(notFound.content[0].text, /FAILED/);

  const rejected = await connect(t, { token: TOKEN, fetch: async () => new Response('', { status: 401 }) });
  const auth = await rejected.callTool({ name: 'niblet_status', arguments: {} });
  assert.match(auth.content[0].text, /API check:\s+reachable, but the request was rejected/);
});

test('the help menu stays in step with the bundled documents', async (t) => {
  // parseModes/parseCommands read the docs at runtime, so a doc edit that adds a
  // four-column table or a `### `x` — y` heading would silently grow this menu.
  const client = await connect(t, { token: TOKEN, fetch: async () => Response.json({}) });
  const text = (await client.callTool({ name: 'niblet_help', arguments: {} })).content.map((i) => i.text).join('\n');
  const modes = ['Persuade', 'Operate', 'Read', 'Experience'];
  for (const mode of modes) assert.match(text, new RegExp(`^  ${mode} — `, 'm'), `mode ${mode} must be listed`);
  const listed = [...text.matchAll(/^ {2}([a-z]+(?: \/ [a-z]+)?) — /gm)].map((m) => m[1]);
  assert.equal(listed.length, 26, 'expected 26 command lines (pin / unpin share one); a change here means the playbook moved');
});

test('niblet_status reports catalogue counts when the API answers', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    assert.equal(new URL(url).pathname, '/v1/stats');
    return Response.json({ apps: 1591, screens: 65930, captioned: 15054, journeys: 473 });
  } });
  const result = await client.callTool({ name: 'niblet_status', arguments: {} });
  assert.match(result.content[0].text, /API check:\s+OK — catalogue holds apps 1591, screens 65930/);
});

test('missing or malformed credentials never reach the API', async (t) => {
  for (const token of ['', '  ', null, `${TOKEN}\r\nInjected: yes`]) {
    await t.test(`credential case ${JSON.stringify(token)?.length ?? 0}`, async (t) => {
      let requests = 0;
      const client = await connect(t, { token, fetch: async () => {
        requests++;
        return Response.json({ results: [] });
      } });
      for (const [name, args] of tools) assertSafeError(await client.callTool({ name, arguments: args }));
      assert.equal(requests, 0);
    });
  }
});

test('query and id values cannot select another origin, route, or query parameter', async (t) => {
  const urls = [];
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    urls.push(url);
    return Response.json({ results: [], screen: null });
  } });
  const query = 'checkout&limit=100#https://elsewhere.invalid/admin';
  await client.callTool({ name: 'find_ui_references', arguments: { query, limit: 1 } });
  assert.equal(urls[0].origin, 'https://api.niblet.com');
  assert.equal(urls[0].pathname, '/v1/search');
  assert.equal(urls[0].searchParams.get('q'), query);
  assert.equal(urls[0].searchParams.get('limit'), '1');
  assert.equal(urls[0].hash, '');

  const id = 'screen?next=elsewhere#x&y';
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'checkout', selectedIds: [id] } });
  assert.notEqual(result.isError, true);
  assert.equal(urls[1].href, `https://api.niblet.com/v1/screens/${encodeURIComponent(id)}`);
  for (const invalid of ['.', '..', '../apps', '%2e%2e', 'a/b', 'a\\b', '\ud800']) {
    assertSafeError(await client.callTool({ name: 'find_ui_references', arguments: { query: 'checkout', selectedIds: [invalid] } }));
  }
  assertSafeError(await client.callTool({ name: 'find_ui_materials', arguments: { query: 'x', kind: 'icon', url: 'https://elsewhere.invalid' } }));
  assert.equal(urls.length, 2);
});

test('invalid search and material arguments never reach the API', async (t) => {
  let calls = 0;
  const client = await connect(t, { token: TOKEN, fetch: async () => {
    calls++;
    return Response.json({});
  } });
  for (const [name, args] of [
    ['find_ui_references', { q: 'checkout' }],
    ['find_ui_references', { query: '' }],
    ['find_ui_references', { query: 'x'.repeat(241) }],
    ['find_ui_references', { query: 'checkout', platform: 'android' }],
    ['find_ui_references', { query: 'checkout', limit: 4 }],
    ['find_ui_references', { query: 'checkout', limit: 1.5 }],
    ['find_ui_references', { query: 'checkout', selectedIds: [] }],
    ['find_ui_references', { query: 'checkout', selectedIds: ['a', 'b', 'c', 'd'] }],
    ['find_ui_references', { query: 'checkout', selectedIds: ['x'.repeat(161)] }],
    ['find_ui_references', { query: 'checkout', app: 'bank' }],
    ['find_ui_materials', { query: 'heading', kind: 'script' }],
    ['find_ui_materials', { query: 'heading' }],
    ['find_ui_materials', { query: 'heading', kind: 'icon', limit: 4 }],
    ['find_ui_materials', { query: 'heading', kind: 'icon', userConfirmed: false }],
  ]) assertSafeError(await client.callTool({ name, arguments: args }));
  assert.equal(calls, 0);
});

test('pack materials short-circuit before any HTTP call and are not an error', async (t) => {
  let calls = 0;
  const client = await connect(t, { token: TOKEN, fetch: async () => {
    calls++;
    return Response.json({ materials: [] });
  } });
  const result = await client.callTool({ name: 'find_ui_materials', arguments: { query: 'anything', kind: 'pack' } });
  assert.notEqual(result.isError, true);
  assert.match(result.content[0].text, /Packs are not available on this server/);
  assert.equal(calls, 0);
});

test('empty results are plain guidance, not errors', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async (url) => Response.json(url.pathname === '/v1/search' ? { results: [] } : { materials: [] }) });
  const refs = await client.callTool({ name: 'find_ui_references', arguments: { query: 'checkout' } });
  assert.notEqual(refs.isError, true);
  assert.match(refs.content[0].text, /No relevant references/);
  const materials = await client.callTool({ name: 'find_ui_materials', arguments: { query: 'checkout', kind: 'font' } });
  assert.notEqual(materials.isError, true);
  assert.match(materials.content[0].text, /No font materials matched/);
});

test('search attaches thumbnails and the evidence preamble', async (t) => {
  const fetched = [];
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    fetched.push(url.href);
    if (url.pathname === '/v1/search') return Response.json({ results: [ref(), ref({ id: 'screen-2', summary: null, width: null, thumbUrl: `${MEDIA_ORIGIN}/thumb/b/2.webp`, inspectUrl: `${MEDIA_ORIGIN}/inspect/b/2.webp` })] });
    return imageResponse();
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings' } });
  assert.notEqual(result.isError, true);
  const [head, ...images] = result.content;
  assert.match(head.text, /^References are evidence, not templates\./);
  assert.match(head.text, /1\. Bank — settings \(ios, 1170×2532\) id=screen-1\n {3}A settings screen\.\n {3}image: https:\/\/media\.niblet\.com\/inspect\/a\/1\.webp/);
  assert.match(head.text, /2\. Bank — settings \(ios\) id=screen-2\n {3}image:/);
  assert.equal(images.length, 2);
  assert.ok(images.every((item) => item.type === 'image' && item.mimeType === 'image/webp' && item.data === Buffer.from(PNG).toString('base64')));
  assert.deepEqual(fetched.slice(1), [`${MEDIA_ORIGIN}/thumb/a/1.webp`, `${MEDIA_ORIGIN}/thumb/b/2.webp`]);
});

test('selectedIds read each screen at inspection quality and skip missing ids', async (t) => {
  const fetched = [];
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    fetched.push(url.href);
    if (url.pathname === '/v1/screens/gone') return new Response('missing', { status: 404 });
    if (url.pathname.startsWith('/v1/screens/')) return Response.json({ screen: ref(), siblings: [ref({ id: 'sibling' })] });
    return imageResponse();
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings', selectedIds: ['gone', 'screen-1'] } });
  assert.notEqual(result.isError, true);
  assert.equal(result.content.length, 3);
  assert.equal(result.content[0].text, 'References are evidence, not templates. Transfer the structural lesson only; never copy branding or copy.');
  assert.match(result.content[1].text, /^1\. Bank — settings/, 'a skipped id must not leave a gap in the numbering');
  assert.equal(JSON.stringify(result).includes('sibling'), false, 'siblings are not part of the selected inspection');
  assert.equal(result.content[2].type, 'image');
  assert.deepEqual(fetched, ['https://api.niblet.com/v1/screens/gone', 'https://api.niblet.com/v1/screens/screen-1', `${MEDIA_ORIGIN}/inspect/a/1.webp`]);

  const none = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings', selectedIds: ['gone'] } });
  assert.notEqual(none.isError, true);
  assert.equal(none.content[0].text, 'No screens found for the given ids.');
});

test('images are fetched only from allowed origins, unauthenticated, and never followed on redirect', async (t) => {
  const attempts = [];
  const client = await connect(t, { token: TOKEN, fetch: async (url, options) => {
    attempts.push({ href: url.href, options });
    if (url.pathname === '/v1/search') {
      return Response.json({ results: [
        ref({ id: 'a', thumbUrl: 'https://elsewhere.invalid/thumb/a.webp' }),
        ref({ id: 'b', thumbUrl: 'javascript:alert(1)' }),
        ref({ id: 'c', thumbUrl: `${MEDIA_ORIGIN}/thumb/c.webp` }),
        ref({ id: 'd', thumbUrl: `${MEDIA_ORIGIN}/thumb/d.html` }),
      ] });
    }
    if (url.pathname === '/thumb/d.html') return new Response('<html>', { headers: { 'content-type': 'text/html' } });
    return imageResponse();
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings', limit: 3 } });
  assert.equal(result.content.filter((item) => item.type === 'image').length, 1, 'only the allowed image origin with an image type is inlined');
  assert.deepEqual(attempts.slice(1).map((a) => a.href), [`${MEDIA_ORIGIN}/thumb/c.webp`],
    'the fourth result is beyond limit:3 and is never fetched');
  for (const attempt of attempts.slice(1)) {
    assert.equal(attempt.options.redirect, 'manual');
    assert.equal(attempt.options.headers.Authorization, undefined, 'the API token is never sent to the media origin');
  }
});

test('a failed image fetch degrades to text instead of failing the call', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    if (url.pathname === '/v1/search') return Response.json({ results: [ref()] });
    throw new Error(`image transport failed with ${TOKEN}`);
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings' } });
  assert.notEqual(result.isError, true);
  assert.equal(result.content.length, 2);
  assert.match(result.content[1].text, /image 1 could not be retrieved/);
  assert.equal(JSON.stringify(result).includes(TOKEN), false);
});

test('an oversized image is skipped without failing the call', async (t) => {
  let cancelled = false;
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    if (url.pathname === '/v1/search') return Response.json({ results: [ref()] });
    return new Response(new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array(1024 * 1024)); },
      cancel() { cancelled = true; },
    }), { headers: { 'content-type': 'image/webp' } });
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings' } });
  assert.notEqual(result.isError, true);
  assert.equal(result.content.length, 2);
  assert.match(result.content[1].text, /image 1 could not be retrieved/);
  assert.equal(cancelled, true);
});

test('the API origin is configurable but never taken from tool input', async (t) => {
  const urls = [];
  const client = await connect(t, { token: TOKEN, apiOrigin: 'http://localhost:3001/ignored/path', mediaOrigin: 'not a url', fetch: async (url) => {
    urls.push(url.href);
    if (url.pathname === '/v1/search') return Response.json({ results: [ref({ thumbUrl: 'http://localhost:3001/media/thumb/a.webp' })] });
    return imageResponse();
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings' } });
  assert.equal(urls[0], 'http://localhost:3001/v1/search?q=settings&limit=2');
  assert.equal(urls[1], 'http://localhost:3001/media/thumb/a.webp', 'the API origin also serves dev media');
  assert.equal(result.content.filter((item) => item.type === 'image').length, 1);
});

test('a 401 tells the agent what to relay to the user, without showing the token', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async () => new Response('', { status: 401 }) });
  for (const name of ['find_ui_references', 'niblet_status']) {
    const args = name === 'niblet_status' ? {} : { query: 'settings' };
    const result = await client.callTool({ name, arguments: args });
    const text = result.content[0].text;
    assert.match(text, /authentication failed \(HTTP 401\)/);
    assert.match(text, new RegExp(`${TOKEN.length} characters, not shown`));
    assert.match(text, /Tell the user/);
    assert.match(text, /shell.*overrides.*\.env/);
    assert.match(text, /restart the MCP server/);
    assert.doesNotMatch(text, new RegExp(TOKEN));
  }
});

test('redirects and HTTP failures are sanitized and never retried', async (t) => {
  for (const status of [302, 401, 403, 404, 429, 500]) {
    await t.test(String(status), async (t) => {
      const calls = [];
      const client = await connect(t, { token: TOKEN, fetch: async (url, options) => {
        calls.push({ url, options });
        return new Response(`backend error includes ${TOKEN}`, { status, headers: { Location: `https://elsewhere.invalid/${TOKEN}` } });
      } });
      assertSafeError(await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings' } }));
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url.origin, 'https://api.niblet.com');
      assert.equal(calls[0].options.redirect, 'manual');
    });
  }
});

test('malformed JSON, invalid response shapes, and transport failures are sanitized', async (t) => {
  const responses = [
    () => new Response(`{"secret":"${TOKEN}`),
    () => new Response(new Uint8Array([0xff])),
    () => Response.json(null),
    () => Response.json([]),
    () => Response.json({ error: TOKEN }),
    () => { throw new Error(`network details: ${TOKEN}`); },
  ];
  for (const [index, response] of responses.entries()) {
    await t.test(String(index), async (t) => {
      const client = await connect(t, { token: TOKEN, fetch: response });
      assertSafeError(await client.callTool({ name: 'find_ui_materials', arguments: { query: 'heading', kind: 'font' } }));
    });
  }
});

test('response byte limits stop both declared and chunked oversized bodies', async (t) => {
  for (const declared of [true, false]) {
    await t.test(declared ? 'declared length' : 'streamed bytes', async (t) => {
      let cancelled = false;
      let chunks = 0;
      const client = await connect(t, { token: TOKEN, fetch: async () => new Response(new ReadableStream({
        pull(controller) {
          chunks++;
          controller.enqueue(new Uint8Array(1024 * 1024));
        },
        cancel() { cancelled = true; },
      }), { headers: { 'Content-Length': declared ? String(2 * 1024 * 1024 + 1) : '1' } }) });
      assertSafeError(await client.callTool({ name: 'find_ui_materials', arguments: { query: 'heading', kind: 'font' } }));
      assert.equal(cancelled, true);
      assert.ok(chunks <= 4, 'stop reading immediately after crossing the byte cap');
    });
  }
});

test('MCP cancellation aborts an in-flight fetch', { timeout: 5_000 }, async (t) => {
  const started = Promise.withResolvers();
  const stopped = Promise.withResolvers();
  const client = await connect(t, { token: TOKEN, fetch: async (_url, { signal }) => {
    started.resolve(signal);
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => {
      stopped.resolve();
      reject(signal.reason);
    }, { once: true }));
  } });
  const controller = new AbortController();
  const call = client.callTool({ name: 'find_ui_references', arguments: { query: 'settings' } }, undefined, { signal: controller.signal });
  const rejected = assert.rejects(call);
  const signal = await started.promise;
  controller.abort();
  await rejected;
  await stopped.promise;
  assert.equal(signal.aborted, true);
});

test('the 15-second deadline aborts stalled response reads without retries', { timeout: 5_000 }, async (t) => {
  const started = Promise.withResolvers();
  let calls = 0;
  let signal;
  const client = await connect(t, { token: TOKEN, fetch: async (_url, options) => {
    calls++;
    signal = options.signal;
    return new Response(new ReadableStream({
      start(controller) {
        signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
      },
      pull() { started.resolve(); },
    }, { highWaterMark: 0 }));
  } });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const call = client.callTool({ name: 'find_ui_materials', arguments: { query: 'heading', kind: 'font' } });
  await started.promise;
  t.mock.timers.tick(15_000);
  const result = await call;
  assertSafeError(result);
  assert.match(result.content[0].text, /timed out/);
  assert.equal(signal.aborted, true);
  assert.equal(calls, 1);
});

test('the advertised limit bounds the fan-out even when the API over-returns', async (t) => {
  let imageFetches = 0;
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    if (url.pathname === '/v1/search') {
      return Response.json({ results: Array.from({ length: 50 }, (_, i) => ref({ id: `s${i}`, thumbUrl: `${MEDIA_ORIGIN}/thumb/${i}.webp` })) });
    }
    imageFetches++;
    return imageResponse();
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings', limit: 2 } });
  assert.equal(imageFetches, 2, 'one image fetch per requested result, never per returned result');
  assert.equal(result.content.filter((item) => item.type === 'image').length, 2);
  assert.equal((result.content[0].text.match(/^\d+\. /gm) ?? []).length, 2, 'the listing is bounded too');

  let materialCount = 0;
  const materials = await client.callTool({ name: 'find_ui_materials', arguments: { query: 'icons', kind: 'icon', limit: 1 } });
  materialCount = (materials.content[0].text.match(/^\d+\. /gm) ?? []).length;
  assert.ok(materialCount <= 1);
});

test('a response missing or renaming the expected list is an error, not an empty catalogue', async (t) => {
  for (const [body, tool, args] of [
    [{ items: [] }, 'find_ui_references', { query: 'x' }],
    [{ results: 'none' }, 'find_ui_references', { query: 'x' }],
    [{ results: { 0: 'a' } }, 'find_ui_references', { query: 'x' }],
    [{ fonts: [] }, 'find_ui_materials', { query: 'x', kind: 'font' }],
    [{ materials: 7 }, 'find_ui_materials', { query: 'x', kind: 'font' }],
  ]) {
    await t.test(JSON.stringify(body), async (t) => {
      const client = await connect(t, { token: TOKEN, fetch: async () => Response.json(body) });
      assertSafeError(await client.callTool({ name: tool, arguments: args }));
    });
  }
});

test('hostile or missing catalogue field types never render as [object Object]', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    if (url.pathname === '/v1/search') {
      return Response.json({ results: [
        { id: { evil: 1 }, app: ['x'], platform: 42, screenType: null, summary: { a: 1 }, width: true, height: 'tall', inspectUrl: 99, thumbUrl: null },
        {},
      ] });
    }
    return imageResponse();
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings', limit: 2 } });
  const text = result.content[0].text;
  assert.equal(text.includes('[object Object]'), false);
  assert.equal(text.includes('undefined'), false);
  assert.match(text, /^1\. unknown app — screen \(42\) id=unknown$/m, 'numbers render, objects and arrays are dropped');
  assert.match(text, /^2\. unknown app — screen \(unknown platform\) id=unknown$/m);
});

test('a catalogue summary cannot flood the agent context', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    if (url.pathname === '/v1/search') return Response.json({ results: [ref({ summary: 'x'.repeat(500_000) })] });
    return imageResponse();
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings', limit: 1 } });
  assert.ok(result.content[0].text.length < 2000, `summary must be clamped, got ${result.content[0].text.length} chars`);
  assert.match(result.content[0].text, /…/);
});

test('only raster image types the catalogue serves are inlined', async (t) => {
  for (const [type, inlined] of [['image/webp', true], ['image/png', true], ['image/jpeg', true], ['image/svg+xml', false], ['text/html', false], ['image/svg+xml; charset=utf-8', false]]) {
    await t.test(type, async (t) => {
      const client = await connect(t, { token: TOKEN, fetch: async (url) => {
        if (url.pathname === '/v1/search') return Response.json({ results: [ref()] });
        return imageResponse(PNG, type);
      } });
      const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings', limit: 1 } });
      assert.equal(result.content.some((item) => item.type === 'image'), inlined);
    });
  }
});

test('an envelope carrying a null error field is a valid response', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    if (url.pathname === '/v1/search') return Response.json({ error: null, results: [ref()] });
    return imageResponse();
  } });
  const result = await client.callTool({ name: 'find_ui_references', arguments: { query: 'settings', limit: 1 } });
  assert.notEqual(result.isError, true);
  assert.match(result.content[0].text, /1\. Bank/);
});

test('every reference result carries the untrusted-evidence framing', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async (url) => {
    if (url.pathname === '/v1/search') return Response.json({ results: [ref()] });
    if (url.pathname.startsWith('/v1/screens/')) return Response.json({ screen: ref() });
    if (url.pathname === '/v1/materials') return Response.json({ materials: [{ name: 'Inter', license: 'OFL-1.1', description: 'A typeface.', url: 'https://example.invalid' }] });
    return imageResponse();
  } });
  for (const args of [{ query: 'settings' }, { query: 'settings', selectedIds: ['screen-1'] }]) {
    const result = await client.callTool({ name: 'find_ui_references', arguments: args });
    assert.match(result.content[0].text, /^References are evidence, not templates\./, JSON.stringify(args));
  }
  const materials = await client.callTool({ name: 'find_ui_materials', arguments: { query: 'sans', kind: 'font' } });
  assert.match(materials.content[0].text, /^Check each license against your intended use/);
});

test('cancellation during an image fetch does not fabricate a successful result', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async (url, options) => {
    if (url.pathname === '/v1/search') return Response.json({ results: [ref()] });
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  } });
  const controller = new AbortController();
  const call = client.callTool({ name: 'find_ui_references', arguments: { query: 'settings', limit: 1 } }, undefined, { signal: controller.signal });
  const rejected = assert.rejects(call);
  await new Promise((resolve) => setImmediate(resolve));
  controller.abort();
  await rejected;
});


test('a web search points at the style reference; an ios search does not', async (t) => {
  const client = await connect(t, {
    token: TOKEN,
    fetch: async (url) => (String(url).includes('/v1/search')
      ? Response.json({ results: [ref({ platform: 'web' })] })
      : imageResponse()),
  });
  const web = await client.callTool({ name: 'find_ui_references', arguments: { query: 'landing', platform: 'web', limit: 1 } });
  assert.match(web.content[0].text, /get_design_reference/);

  const iosClient = await connect(t, {
    token: TOKEN,
    fetch: async (url) => (String(url).includes('/v1/search') ? Response.json({ results: [ref()] }) : imageResponse()),
  });
  const ios = await iosClient.callTool({ name: 'find_ui_references', arguments: { query: 'settings', platform: 'ios', limit: 1 } });
  assert.doesNotMatch(ios.content[0].text, /get_design_reference/);
});

test('get_design_reference returns the markdown with its preamble and source', async (t) => {
  const client = await connect(t, {
    token: TOKEN,
    fetch: async () => Response.json({ slug: 'bank', name: 'Bank', theme: 'light', markdown: DESIGN_MD }),
  });
  const result = await client.callTool({ name: 'get_design_reference', arguments: { screenId: 'screen-1' } });
  assert.notEqual(result.isError, true);
  const text = result.content.map((item) => item.text).join('\n');
  assert.match(text, /References are evidence, not templates/);
  assert.match(text, /Source: https:\/\/niblet\.com\/packs\/bank/);
  assert.match(text, /# Bank — Style Reference/);
});

test('a screen with no pack is a plain answer, not an error', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async () => new Response('{}', { status: 404 }) });
  const byScreen = await client.callTool({ name: 'get_design_reference', arguments: { screenId: 'ios-1' } });
  assert.notEqual(byScreen.isError, true);
  assert.match(byScreen.content[0].text, /Only web screens have one/);

  const bySlug = await client.callTool({ name: 'get_design_reference', arguments: { packSlug: 'nope' } });
  assert.notEqual(bySlug.isError, true);
  assert.match(bySlug.content[0].text, /No design pack with that slug/);
});

test('get_design_reference rejects an empty argument set and a malformed body', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async () => Response.json({ slug: 'bank' }) });
  const empty = await client.callTool({ name: 'get_design_reference', arguments: {} });
  assert.equal(empty.isError, true);
  assertSafeError(await client.callTool({ name: 'get_design_reference', arguments: { packSlug: 'bank' } }));
});

test('niblet_help and niblet_status name every tool the server registers', async (t) => {
  const client = await connect(t, { token: TOKEN, fetch: async () => Response.json({}) });
  const { tools: listed } = await client.listTools();
  const help = (await client.callTool({ name: 'niblet_help', arguments: {} })).content[0].text;
  const status = (await client.callTool({ name: 'niblet_status', arguments: { probe: false } })).content[0].text;
  for (const { name } of listed) {
    // niblet_help is the menu, so it names the catalogue tools rather than itself.
    if (name !== 'niblet_help') assert.ok(help.includes(name), `niblet_help omits ${name}`);
    assert.ok(status.includes(name), `niblet_status omits ${name}`);
  }
});
