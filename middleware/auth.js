/**
 * Authentication middleware for Freelo API
 * Uses HTTP Basic Authentication as specified in the Freelo API documentation
 */

import axios from 'axios';

// Authentication middleware
const authenticate = async (req, res, next) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Use HTTP Basic Authentication.'
    });
  }

  // Check for User-Agent header
  const userAgent = req.headers['user-agent'];
  if (!userAgent) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'User-Agent header is required'
    });
  }

  try {
    // Extract credentials from Authorization header
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [email, apiKey] = credentials.split(':');

    if (!email || !apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials format'
      });
    }

    // Store credentials in request object for use in controllers
    req.auth = {
      email,
      apiKey,
      userAgent
    };

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

export default {
  authenticate
};
