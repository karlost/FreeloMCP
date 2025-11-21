#!/usr/bin/env node

/**
 * Freelo MCP Server - Streamable HTTP Transport
 *
 * Modern HTTP transport implementation using MCP Streamable HTTP protocol.
 * Replaces deprecated SSE transport with the standard MCP HTTP transport.
 *
 * Uses stateful pattern with session management:
 * - Creates one Server + Transport per session
 * - Maintains Map of transports by session ID
 * - Reuses transports for existing sessions
 * - Supports multiple concurrent clients
 *
 * Usage:
 *   node mcp-server-http.js [port]
 *   PORT=8080 node mcp-server-http.js
 *
 * Endpoints:
 *   POST/GET /mcp/v1/endpoint - MCP protocol endpoint
 *   GET /health - Health check endpoint
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { initializeMcpServer } from './mcp-server.js';

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.FREELO_EMAIL || !process.env.FREELO_API_KEY || !process.env.FREELO_USER_AGENT) {
  console.error('Error: Missing required environment variables');
  console.error('Required: FREELO_EMAIL, FREELO_API_KEY, FREELO_USER_AGENT');
  process.exit(1);
}

/**
 * Main startup function
 */
async function main() {
  const app = express();
  app.use(cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'MCP-Protocol-Version', 'Accept']
  }));

  // IMPORTANT: Do NOT use express.json() or any body parser middleware
  // StreamableHTTPServerTransport needs raw request stream

  // Map to store transports by session ID
  const transports = new Map();

  /**
   * Main MCP endpoint - handles session routing
   * Creates new server + transport per session, reuses for existing sessions
   */
  app.all('/mcp/v1/endpoint', async (req, res) => {
    try {
      // Check for existing session ID in header
      const sessionId = req.headers['mcp-session-id'];

      if (sessionId && transports.has(sessionId)) {
        // Existing session - reuse transport
        const transport = transports.get(sessionId);
        await transport.handleRequest(req, res);
      } else {
        // New session - create new server and transport
        const server = initializeMcpServer();

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          enableJsonResponse: true,  // Return JSON instead of SSE for POST requests
          onsessioninitialized: (sessionId) => {
            console.log(`Session initialized: ${sessionId}`);
            transports.set(sessionId, transport);
          }
        });

        // Setup cleanup on close
        server.onclose = async () => {
          const sid = transport.sessionId;
          if (sid && transports.has(sid)) {
            console.log(`Session closed: ${sid}`);
            transports.delete(sid);
          }
        };

        // Connect server to transport
        await server.connect(transport);

        // Handle the request
        await transport.handleRequest(req, res);
      }
    } catch (error) {
      console.error('MCP transport error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      } else {
        // Response already started, destroy it
        res.destroy(error);
      }
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'freelo-mcp-http',
      version: '2.4.0',
      transport: 'streamable-http',
      endpoints: {
        mcp: '/mcp/v1/endpoint',
        health: '/health'
      },
      features: {
        sessionManagement: true,
        multiClient: true,
        activeSessions: transports.size,
        mcpProtocol: '2025-03-26'
      }
    });
  });

  // Start HTTP server
  const PORT = process.env.PORT || process.argv[2] || 3000;

  app.listen(PORT, () => {
    console.log(`╔════════════════════════════════════════════════════════╗`);
    console.log(`║  Freelo MCP Server (Streamable HTTP Transport)        ║`);
    console.log(`╠════════════════════════════════════════════════════════╣`);
    console.log(`║  Server running on: http://localhost:${String(PORT).padEnd(21)}║`);
    console.log(`║  MCP endpoint:      /mcp/v1/endpoint                   ║`);
    console.log(`║  Health check:      /health                            ║`);
    console.log(`╠════════════════════════════════════════════════════════╣`);
    console.log(`║  Environment:                                          ║`);
    console.log(`║    FREELO_EMAIL: ${(process.env.FREELO_EMAIL || '').substring(0, 32).padEnd(32)}║`);
    console.log(`║    98 MCP tools available                             ║`);
    console.log(`║  Transport: Streamable HTTP (Multi-Session)           ║`);
    console.log(`║  Pattern: One server + transport per session          ║`);
    console.log(`╚════════════════════════════════════════════════════════╝`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    console.log(`Closing ${transports.size} active sessions...`);

    // Close all transports
    for (const [sessionId, transport] of transports.entries()) {
      try {
        await transport.close();
        console.log(`  Closed session: ${sessionId}`);
      } catch (error) {
        console.error(`  Error closing session ${sessionId}:`, error);
      }
    }

    transports.clear();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Start the server
main().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
