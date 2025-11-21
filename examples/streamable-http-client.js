/**
 * Example: Streamable HTTP Transport Client
 *
 * Demonstrates how to connect to Freelo MCP Server using Streamable HTTP transport.
 * This example shows the complete flow:
 * 1. Initialize MCP connection
 * 2. Get session ID
 * 3. List available tools
 * 4. Call a tool (get_projects)
 * 5. Handle responses
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'http://localhost:3000/mcp/v1/endpoint';
const HEALTH_ENDPOINT = process.env.HEALTH_ENDPOINT || 'http://localhost:3000/health';

let sessionId = null;
let requestId = 1;

/**
 * Check server health
 */
async function checkHealth() {
  console.log('\n📡 Checking server health...');
  try {
    const response = await axios.get(HEALTH_ENDPOINT);
    console.log('✅ Server is healthy:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
}

/**
 * Initialize MCP connection and get session ID
 */
async function initialize() {
  console.log('\n🔌 Initializing MCP connection...');

  const initRequest = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'initialize',
    params: {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: {
        name: 'streamable-http-example',
        version: '1.0.0'
      }
    }
  };

  try {
    const response = await axios.post(MCP_ENDPOINT, initRequest, {
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': '2025-03-26',
        'Accept': 'application/json, text/event-stream'
      }
    });

    // Extract session ID from response header
    sessionId = response.headers['mcp-session-id'];
    console.log('✅ Initialization successful');
    console.log('   Session ID:', sessionId);
    console.log('   Server Info:', JSON.stringify(response.data.result?.serverInfo, null, 2));

    return response.data;
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    throw error;
  }
}

/**
 * List available tools
 */
async function listTools() {
  console.log('\n📋 Listing available tools...');

  if (!sessionId) {
    throw new Error('Session not initialized. Call initialize() first.');
  }

  const listRequest = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/list',
    params: {}
  };

  try {
    const response = await axios.post(MCP_ENDPOINT, listRequest, {
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': '2025-03-26',
        'Mcp-Session-Id': sessionId,
        'Accept': 'application/json, text/event-stream'
      }
    });

    const tools = response.data.result?.tools || [];
    console.log(`✅ Found ${tools.length} tools`);

    // Display first 5 tools as example
    console.log('   First 5 tools:');
    tools.slice(0, 5).forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description.substring(0, 60)}...`);
    });

    return tools;
  } catch (error) {
    console.error('❌ Failed to list tools:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Call a specific tool
 */
async function callTool(toolName, args = {}) {
  console.log(`\n🔧 Calling tool: ${toolName}`);
  console.log('   Arguments:', JSON.stringify(args, null, 2));

  if (!sessionId) {
    throw new Error('Session not initialized. Call initialize() first.');
  }

  const toolRequest = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    }
  };

  try {
    const response = await axios.post(MCP_ENDPOINT, toolRequest, {
      headers: {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': '2025-03-26',
        'Mcp-Session-Id': sessionId,
        'Accept': 'application/json, text/event-stream'
      }
    });

    console.log('✅ Tool call successful');
    return response.data;
  } catch (error) {
    console.error('❌ Tool call failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Main execution flow
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Freelo MCP - Streamable HTTP Client Example          ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    // 1. Check server health
    await checkHealth();

    // 2. Initialize connection
    await initialize();

    // 3. List available tools
    await listTools();

    // 4. Call get_projects tool as example
    const projectsResult = await callTool('get_projects');

    console.log('\n📊 Projects Result:');
    if (projectsResult.result?.content?.[0]?.text) {
      const data = JSON.parse(projectsResult.result.content[0].text);
      console.log(`   Found ${data.length} projects`);

      // Display first 3 projects
      data.slice(0, 3).forEach(project => {
        console.log(`   - ${project.name} (ID: ${project.id})`);
      });
    }

    // 5. Optional: Call another tool - get_users
    console.log('\n📊 Fetching users...');
    const usersResult = await callTool('get_users');

    if (usersResult.result?.content?.[0]?.text) {
      const users = JSON.parse(usersResult.result.content[0].text);
      console.log(`   Found ${users.length} users`);

      // Display first 3 users
      users.slice(0, 3).forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ All operations completed successfully!             ║');
    console.log('╚════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════╗');
    console.error('║  ❌ Example failed with error                          ║');
    console.error('╚════════════════════════════════════════════════════════╝');
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

// Run the example
main();

/**
 * Usage:
 *
 * 1. Start the HTTP server:
 *    npm run mcp:http
 *
 * 2. Run this example:
 *    node examples/streamable-http-client.js
 *
 * 3. Expected output:
 *    - Health check result
 *    - Session initialization
 *    - List of available tools
 *    - Projects from Freelo
 *    - Users from Freelo
 *
 * Environment variables:
 *    MCP_ENDPOINT - MCP server endpoint (default: http://localhost:3000/mcp/v1/endpoint)
 *    HEALTH_ENDPOINT - Health check endpoint (default: http://localhost:3000/health)
 */
