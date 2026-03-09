/**
 * Helper to unwrap paginated Freelo API responses.
 *
 * Many Freelo endpoints return:
 *   { total, count, page, per_page, data: { <key>: [...] } }
 *
 * This helper extracts the inner array and attaches pagination metadata.
 */

/**
 * Unwrap a paginated API response into a flat array with pagination info.
 * If the response is already an array, returns it as-is.
 *
 * @param {Object|Array} responseData - The raw API response data
 * @returns {Object} - { items: [...], pagination?: { total, count, page, per_page } }
 */
export function unwrapPaginatedResponse(responseData) {
  // Already an array — return directly
  if (Array.isArray(responseData)) {
    return responseData;
  }

  // Paginated response: { total, count, page, per_page, data: { key: [...] } }
  if (responseData && typeof responseData === 'object' && responseData.data && typeof responseData.data === 'object') {
    const dataObj = responseData.data;
    // Find the first array value inside data
    const keys = Object.keys(dataObj);
    for (const key of keys) {
      if (Array.isArray(dataObj[key])) {
        return dataObj[key];
      }
    }
  }

  // Wrapped in a single key: { states: [...] }, { custom_field_types: [...] }
  if (responseData && typeof responseData === 'object') {
    const keys = Object.keys(responseData);
    if (keys.length === 1 && Array.isArray(responseData[keys[0]])) {
      return responseData[keys[0]];
    }
  }

  // Fallback: return as-is
  return responseData;
}
