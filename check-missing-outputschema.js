import { initializeMcpServer } from './mcp-server.js';

const server = initializeMcpServer();
const tools = server._registeredTools;

console.log('Tools missing outputSchema:\n');
let count = 0;

for (const [name, tool] of Object.entries(tools)) {
  if (!tool.outputSchema) {
    console.log(`  - ${name}`);
    count++;
  }
}

console.log(`\nTotal missing: ${count}/98`);
