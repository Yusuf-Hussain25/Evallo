// Evallo Configuration Example
// Copy this file to config.js and modify as needed

module.exports = {
  // Backend Configuration
  port: process.env.PORT || 5000,
  environment: process.env.NODE_ENV || 'development',
  
  // Logging Configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  maxLogs: parseInt(process.env.MAX_LOGS) || 1000,
  
  // Security Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // API Configuration
  apiVersion: 'v1',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
}; 