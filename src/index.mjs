#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.mjs';

const server = createServer();
server.server.onerror = () => {
  console.error('Niblet MCP encountered a protocol error.');
};

async function shutdown() {
  try {
    await server.close();
  } catch {
    console.error('Niblet MCP could not close cleanly.');
    process.exitCode = 1;
  }
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

try {
  await server.connect(new StdioServerTransport());
} catch {
  console.error('Niblet MCP could not start. Check the installation and MCP client configuration.');
  process.exitCode = 1;
}
