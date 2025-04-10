#!/usr/bin/env node

/**
 * Freelo MCP Server CLI
 * Spustitelný soubor pro npx
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Získání cesty k aktuálnímu adresáři
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Cesta k MCP serveru
const mcpServerPath = path.join(rootDir, 'mcp-server.js');

// Spuštění MCP serveru
console.log('Starting Freelo MCP Server...');
console.log(`Server path: ${mcpServerPath}`);

// Spustit MCP server jako child process
const mcpServer = spawn('node', [mcpServerPath], {
  stdio: 'inherit',
  cwd: rootDir
});

// Zpracování ukončení procesu
mcpServer.on('close', (code) => {
  console.log(`Freelo MCP Server exited with code ${code}`);
  process.exit(code);
});

// Zpracování signálů pro ukončení
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down Freelo MCP Server...');
  mcpServer.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down Freelo MCP Server...');
  mcpServer.kill('SIGTERM');
});
