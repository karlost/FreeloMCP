/**
 * Error handling utility for MCP tools
 */

/**
 * Handle errors consistently across all MCP tools
 * @param {Error} error - The error object
 * @param {string} toolName - The name of the tool where the error occurred
 * @returns {Object} - MCP response object with error details
 */
const handleToolError = (error, toolName) => {
  // Determine error type and create appropriate error message
  let errorMessage = 'An unexpected error occurred';
  let errorDetails = error.toString();
  let statusCode = null;
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    statusCode = error.response.status;
    errorDetails = error.response.data;
    
    if (statusCode === 401 || statusCode === 403) {
      errorMessage = 'Authentication failed. Please check your credentials.';
    } else if (statusCode === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (statusCode >= 400 && statusCode < 500) {
      errorMessage = 'The request was invalid or could not be processed.';
    } else if (statusCode >= 500) {
      errorMessage = 'The server encountered an error while processing the request.';
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage = 'No response received from the server. Please check your network connection.';
    errorDetails = error.request;
  } else {
    // Something happened in setting up the request that triggered an Error
    errorMessage = 'Error setting up the request: ' + error.message;
  }
  
  console.error(`Error in ${toolName} (${statusCode || 'unknown'}):`, error);
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        error: 'Tool execution failed',
        message: errorMessage,
        status: statusCode,
        details: errorDetails
      })
    }],
    isError: true
  };
};

export {
  handleToolError
};
