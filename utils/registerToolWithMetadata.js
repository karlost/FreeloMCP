/**
 * Helper function to register MCP tools with automatic annotations
 */

import { getAnnotations, getToolTitle } from './toolAnnotations.js';

/**
 * Registers a tool with automatic annotations based on tool name
 *
 * This is a wrapper around server.registerTool() that automatically adds:
 * - annotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint)
 * - title (auto-generated from tool name)
 *
 * @param {McpServer} server - MCP server instance
 * @param {string} name - Tool name (e.g., "get_projects")
 * @param {string} description - Tool description
 * @param {object} inputSchema - Zod schema for input parameters
 * @param {function} callback - Tool implementation function
 * @param {object} [options] - Optional overrides
 * @param {object} [options.annotations] - Override auto-generated annotations
 * @param {string} [options.title] - Override auto-generated title
 * @param {object} [options.outputSchema] - Optional output schema
 * @returns {RegisteredTool} Registered tool object
 *
 * @example
 * // Simple read-only tool
 * registerToolWithMetadata(
 *   server,
 *   'get_projects',
 *   'Fetches all projects',
 *   {},
 *   async () => { ... }
 * );
 *
 * @example
 * // With custom annotations
 * registerToolWithMetadata(
 *   server,
 *   'custom_tool',
 *   'Does something custom',
 *   { param: z.string() },
 *   async ({ param }) => { ... },
 *   {
 *     annotations: { readOnlyHint: true, customField: 'value' },
 *     title: 'Custom Tool Name'
 *   }
 * );
 */
export function registerToolWithMetadata(
  server,
  name,
  description,
  inputSchema,
  callback,
  options = {}
) {
  // Get automatic annotations based on tool name
  const autoAnnotations = getAnnotations(name);

  // Get automatic title
  const autoTitle = getToolTitle(name);

  // IMPORTANT: MCP SDK automatically calls z.object() on inputSchema and outputSchema
  // If we pass z.object(...) directly, SDK will do z.object(z.object(...)) which breaks
  // Solution: Extract .shape from ZodObject schemas to get the raw shape
  let processedInputSchema = inputSchema;
  let processedOutputSchema = options.outputSchema;

  // If inputSchema is a ZodObject, extract its shape
  if (inputSchema && typeof inputSchema === 'object' && inputSchema._def && inputSchema._def.typeName === 'ZodObject') {
    processedInputSchema = inputSchema.shape;
  }

  // If outputSchema is a ZodObject, extract its shape
  if (processedOutputSchema && typeof processedOutputSchema === 'object' && processedOutputSchema._def && processedOutputSchema._def.typeName === 'ZodObject') {
    processedOutputSchema = processedOutputSchema.shape;
  }

  // Build config object for registerTool
  const config = {
    title: options.title || autoTitle,
    description: description,
    inputSchema: processedInputSchema,
    annotations: {
      ...autoAnnotations,
      ...(options.annotations || {})
    }
  };

  // Add outputSchema if provided
  if (processedOutputSchema) {
    config.outputSchema = processedOutputSchema;
  }

  // Register the tool
  return server.registerTool(name, config, callback);
}

/**
 * Registers a tool using the old server.tool() syntax
 * This is a compatibility wrapper that converts old-style calls to new registerTool
 *
 * @deprecated Use registerToolWithMetadata instead
 */
export function registerToolLegacy(server, name, description, inputSchema, callback) {
  return registerToolWithMetadata(server, name, description, inputSchema, callback);
}
