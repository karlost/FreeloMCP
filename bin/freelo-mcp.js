#!/usr/bin/env node

/**
 * Freelo MCP Server CLI
 * Spustitelný soubor pro npx
 *
 * Tento soubor pouze importuje a spouští MCP server.
 * DŮLEŽITÉ: Nepoužívat console.log() - porušuje MCP protokol!
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Získání cesty k MCP serveru
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const mcpServerPath = join(__dirname, '..', 'mcp-server.js');

// Import a spuštění MCP serveru
// MCP komunikuje přes stdio, proto nesmíme používat console.log
await import(mcpServerPath);
