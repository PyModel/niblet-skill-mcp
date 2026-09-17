#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.mjs';

const SHUTDOWN_TIMEOUT = 5_000;
let server;
let shuttingDown = false;

async function shutdown() {
  if (!server || shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => {
    console.error('Niblet MCP did not close within five seconds; forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  deadline.unref();

  try {
    await server.close();
    clearTimeout(deadline);
  } catch {
    console.error('Niblet MCP could not close cleanly.');
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

try {
  server = createServer();
  server.server.onerror = () => {
    console.error('Niblet MCP encountered a protocol error.');
  };
  await server.connect(new StdioServerTransport());
} catch {
  console.error('Niblet MCP could not start. Check the installation and MCP client configuration.');
  process.exitCode = 1;
}
