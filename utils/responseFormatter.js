/**
 * Response formatting utility for MCP tools
 */

/**
 * Format response data for better readability
 * @param {Object|Array} data - The response data to format
 * @returns {Object} - MCP response object with formatted content
 */
const formatResponse = (data) => {
  // Format the response data with indentation
  const formattedData = JSON.stringify(data, null, 2);
  
  // Create a summary based on the response type
  let summary = '';
  if (Array.isArray(data)) {
    summary = `Found ${data.length} items`;
  } else if (data && typeof data === 'object') {
    if (data.id) {
      summary = `Item with ID ${data.id}`;
      if (data.name) {
        summary += `: ${data.name}`;
      } else if (data.title) {
        summary += `: ${data.title}`;
      }
    } else if (data.result === 'success' || data.status === 'success') {
      summary = 'Operation completed successfully';
    } else if (data.result === 'error' || data.status === 'error') {
      summary = `Error: ${data.message || 'Unknown error'}`;
    }
  }
  
  // Return formatted response
  return {
    content: [
      ...(summary ? [{ type: 'text', text: `${summary}\n\n` }] : []),
      { type: 'text', text: formattedData }
    ]
  };
};

export {
  formatResponse
};
