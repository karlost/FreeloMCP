/**
 * Response formatting utility for MCP tools
 */

/**
 * Format response data for better readability
 * @param {Object|Array} data - The response data to format
 * @returns {Object} - MCP response object with formatted content
 */
const formatResponse = (data) => {
  const isArray = Array.isArray(data);
  const isObject = data && typeof data === 'object' && !isArray;

  // Structured content must be an object - wrap arrays/primitives
  const structuredContent = isArray
    ? { items: data }
    : isObject
      ? data
      : { value: data };

  // Format the response data with indentation
  const formattedData = JSON.stringify(structuredContent, null, 2);

  // Create a summary based on the response type
  let summary = '';
  if (isArray) {
    summary = `Found ${data.length} items`;
  } else if (isObject) {
    if (structuredContent.id) {
      summary = `Item with ID ${structuredContent.id}`;
      if (structuredContent.name) {
        summary += `: ${structuredContent.name}`;
      } else if (structuredContent.title) {
        summary += `: ${structuredContent.title}`;
      }
    } else if (structuredContent.result === 'success' || structuredContent.status === 'success') {
      summary = 'Operation completed successfully';
    } else if (structuredContent.result === 'error' || structuredContent.status === 'error') {
      summary = `Error: ${structuredContent.message || 'Unknown error'}`;
    }
  }

  // Return formatted response
  return {
    content: [
      ...(summary ? [{ type: 'text', text: `${summary}\n\n` }] : []),
      { type: 'text', text: formattedData }
    ],
    structuredContent
  };
};

export {
  formatResponse
};
