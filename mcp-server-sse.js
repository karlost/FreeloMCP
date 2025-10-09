#!/usr/bin/env node

/**
 * Freelo MCP Server - SSE Transport
 *
 * HTTP/SSE server pro vzdálený přístup k Freelo MCP tools.
 * Určeno pro n8n, webové klienty a další nástroje vyžadující HTTP přístup.
 *
 * Použití:
 *   node mcp-server-sse.js [port]
 *   PORT=8080 node mcp-server-sse.js
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { initializeMcpServer } from './mcp-server.js';

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.FREELO_EMAIL || !process.env.FREELO_API_KEY || !process.env.FREELO_USER_AGENT) {
  console.error('Error: Missing required environment variables');
  console.error('Required: FREELO_EMAIL, FREELO_API_KEY, FREELO_USER_AGENT');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Store active transports by session ID
const transports = new Map();

// SSE endpoint - clients connect here for event stream
app.get('/sse', async (req, res) => {
  console.log('New SSE connection established');

  // Create new MCP server instance for this connection
  const server = initializeMcpServer();

  // Create SSE transport
  const transport = new SSEServerTransport('/message', res);

  // Store transport for POST endpoint access
  const sessionId = Math.random().toString(36).substring(7);
  transports.set(sessionId, transport);

  // Set session ID in response header
  res.setHeader('X-Session-ID', sessionId);

  // Connect server to transport
  try {
    await server.connect(transport);
    console.log(`MCP server connected via SSE (session: ${sessionId})`);
  } catch (error) {
    console.error('Failed to connect MCP server:', error);
    transports.delete(sessionId);
    if (!res.headersSent) {
      res.status(500).end();
    }
  }

  // Clean up on connection close
  req.on('close', () => {
    console.log(`SSE connection closed (session: ${sessionId})`);
    transports.delete(sessionId);
  });
});

// POST endpoint - clients send messages here
app.post('/message', async (req, res) => {
  const sessionId = req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing X-Session-ID header' });
  }

  const transport = transports.get(sessionId);

  if (!transport) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }

  try {
    await transport.handlePostMessage(req, res);
  } catch (error) {
    console.error('Error handling POST message:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'freelo-mcp-sse',
    version: '2.1.0',
    activeConnections: transports.size,
    endpoints: {
      sse: '/sse',
      messages: '/message',
      health: '/health'
    }
  });
});

// Start server
const PORT = process.env.PORT || process.argv[2] || 3000;

app.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════════════════╗`);
  console.log(`║  Freelo MCP Server (SSE Transport)                    ║`);
  console.log(`╠════════════════════════════════════════════════════════╣`);
  console.log(`║  Server running on: http://localhost:${PORT.toString().padEnd(21)}║`);
  console.log(`║  SSE endpoint:      http://localhost:${PORT}/sse${' '.repeat(15)}║`);
  console.log(`║  Health check:      http://localhost:${PORT}/health${' '.repeat(11)}║`);
  console.log(`╠════════════════════════════════════════════════════════╣`);
  console.log(`║  Environment:                                          ║`);
  console.log(`║    FREELO_EMAIL: ${process.env.FREELO_EMAIL?.substring(0, 20).padEnd(20)}       ║`);
  console.log(`║    98 MCP tools available                             ║`);
  console.log(`╚════════════════════════════════════════════════════════╝`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
