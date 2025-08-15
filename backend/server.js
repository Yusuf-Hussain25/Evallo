const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// JSON file database path
const DB_FILE = path.join(__dirname, 'logs.json');

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Initialize database file if it doesn't exist
async function initializeDatabase() {
  try {
    await fs.access(DB_FILE);
  } catch (error) {
    // File doesn't exist, create it with empty logs array
    await fs.writeFile(DB_FILE, JSON.stringify({ logs: [] }, null, 2));
    console.log('📁 Created new logs database file');
  }
}

// Read logs from JSON file
async function readLogs() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data).logs || [];
  } catch (error) {
    console.error('Error reading logs:', error);
    return [];
  }
}

// Write logs to JSON file
async function writeLogs(logs) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify({ logs }, null, 2));
  } catch (error) {
    console.error('Error writing logs:', error);
    throw error;
  }
}

// Helper function to validate log entry against the exact schema
const validateLogEntry = (logEntry) => {
  const required = ['level', 'message', 'resourceId', 'timestamp', 'traceId', 'spanId', 'commit', 'metadata'];
  const missing = required.filter(field => !logEntry[field]);
  
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  
  // Validate level - must be one of: error, warn, info, debug
  const validLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLevels.includes(logEntry.level)) {
    return { valid: false, error: `Invalid level. Must be one of: ${validLevels.join(', ')}` };
  }
  
  // Validate timestamp - must be ISO 8601 format
  if (isNaN(new Date(logEntry.timestamp).getTime())) {
    return { valid: false, error: 'Invalid timestamp format. Must be ISO 8601' };
  }
  
  // Validate metadata - must be an object
  if (typeof logEntry.metadata !== 'object' || logEntry.metadata === null) {
    return { valid: false, error: 'Metadata must be a JSON object' };
  }
  
  return { valid: true };
};

// Routes

// POST /logs - Ingest a single log entry
app.post('/logs', async (req, res) => {
  try {
    const logEntry = req.body;
    
    // Validate the log entry against the exact schema
    const validation = validateLogEntry(logEntry);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    // Read existing logs
    const logs = await readLogs();
    
    // Add ID and store timestamp
    const newLog = {
      id: Date.now().toString(), // Simple ID generation
      ...logEntry,
      timestamp: new Date(logEntry.timestamp).toISOString(),
      ingestedAt: new Date().toISOString()
    };
    
    // Add to beginning for reverse chronological order
    logs.unshift(newLog);
    
    // Keep only last 1000 logs to prevent file size issues
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    
    // Write back to file
    await writeLogs(logs);
    
    // Emit real-time update to all connected clients
    io.emit('newLog', {
      type: 'logIngested',
      log: newLog,
      totalLogs: logs.length
    });
    
    res.status(201).json({
      message: 'Log ingested successfully',
      log: newLog
    });
  } catch (error) {
    console.error('Error ingesting log:', error);
    res.status(500).json({ error: 'Internal server error during log ingestion or persistence' });
  }
});

// GET /logs - Retrieve logs with filtering
app.get('/logs', async (req, res) => {
  try {
    const {
      level,
      message,
      resourceId,
      timestamp_start,
      timestamp_end,
      traceId,
      spanId,
      commit
    } = req.query;
    
    // Read logs from file
    const logs = await readLogs();
    let filteredLogs = [...logs];
    
    // Apply filters using AND logic (all filters must match)
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (message) {
      const messageLower = message.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(messageLower)
      );
    }
    
    if (resourceId) {
      filteredLogs = filteredLogs.filter(log => log.resourceId === resourceId);
    }
    
    if (timestamp_start) {
      const startDate = new Date(timestamp_start);
      if (!isNaN(startDate.getTime())) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= startDate
        );
      }
    }
    
    if (timestamp_end) {
      const endDate = new Date(timestamp_end);
      if (!isNaN(endDate.getTime())) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= endDate
        );
      }
    }
    
    if (traceId) {
      filteredLogs = filteredLogs.filter(log => log.traceId === traceId);
    }
    
    if (spanId) {
      filteredLogs = filteredLogs.filter(log => log.spanId === spanId);
    }
    
    if (commit) {
      filteredLogs = filteredLogs.filter(log => log.commit === commit);
    }
    
    // Sort in reverse chronological order by timestamp
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(filteredLogs);
  } catch (error) {
    console.error('Error querying logs:', error);
    res.status(500).json({ error: 'Internal server error during data retrieval or filtering' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    server.listen(PORT, () => {
      console.log(` Log Ingestion Server running on port ${PORT}`);
      console.log(` Database: ${DB_FILE}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(` Log ingestion: POST http://localhost:${PORT}/logs`);
      console.log(` Log querying: GET http://localhost:${PORT}/logs`);
      console.log(` WebSocket server ready for real-time updates`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; 