/**
 * Invoices Tools
 */

import { z } from 'zod';
import { createApiClient } from '../utils/apiClient.js';
import { formatResponse } from '../utils/responseFormatter.js';
import { handleToolError } from '../utils/errorHandler.js';

export function registerInvoicesTools(server) {
  // Tools are temporarily in core.js
  // TODO: Extract specific tools for this category
}
