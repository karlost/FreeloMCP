/**
 * Authentication helper - eliminates auth boilerplate from every tool handler
 */

import { createApiClient } from './apiClient.js';

export function getApiClient() {
  return createApiClient({
    email: process.env.FREELO_EMAIL,
    apiKey: process.env.FREELO_API_KEY,
    userAgent: process.env.FREELO_USER_AGENT
  });
}
