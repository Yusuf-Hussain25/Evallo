import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, AlertTriangle, Info, AlertCircle, Clock, Server, MessageSquare, GitCommit, Hash, Database, BarChart3 } from 'lucide-react';
import useWebSocket from './hooks/useWebSocket';
import Analytics from './components/Analytics';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filter states - updated to match new API schema
  const [filters, setFilters] = useState({
    message: '',
    level: '',
    resourceId: '',
    timestamp_start: '',
    timestamp_end: '',
    traceId: '',
    spanId: '',
    commit: ''
  });

  // Fetch logs from API
  const fetchLogs = useCallback(async (filterParams = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filterParams);
      const response = await fetch(`/logs?${queryParams}`);
      const data = await response.json();
      setLogs(data);
      setFilteredLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics from logs
  const calculateStats = useCallback((logs) => {
    if (!logs || logs.length === 0) return null;
    
    const stats = {
      total: logs.length,
      byLevel: {
        error: logs.filter(log => log.level === 'error').length,
        warn: logs.filter(log => log.level === 'warn').length,
        info: logs.filter(log => log.level === 'info').length,
        debug: logs.filter(log => log.level === 'debug').length
      },
      byResource: {},
      byTrace: {},
      recentActivity: logs.slice(0, 10).map(log => ({
        id: log.id,
        level: log.level,
        message: log.message.substring(0, 100),
        timestamp: log.timestamp,
        resourceId: log.resourceId,
        traceId: log.traceId
      }))
    };
    
    // Count by resource and trace
    logs.forEach(log => {
      stats.byResource[log.resourceId] = (stats.byResource[log.resourceId] || 0) + 1;
      stats.byTrace[log.traceId] = (stats.byTrace[log.traceId] || 0) + 1;
    });
    
    return stats;
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    const filterParams = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) filterParams[key] = value;
    });
    fetchLogs(filterParams);
  }, [filters, fetchLogs]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      message: '',
      level: '',
      resourceId: '',
      timestamp_start: '',
      timestamp_end: '',
      traceId: '',
      spanId: '',
      commit: ''
    });
    fetchLogs();
  };

  // WebSocket real-time log handling
  const handleNewLog = useCallback((data) => {
    if (data.type === 'logIngested') {
      // Add new log to the beginning of the list
      setLogs(prevLogs => [data.log, ...prevLogs]);
      setFilteredLogs(prevLogs => [data.log, ...prevLogs]);
      
      // Update stats
      const newStats = calculateStats([data.log, ...logs]);
      setStats(newStats);
    }
  }, [logs, calculateStats]);

  // Initialize WebSocket connection
  const { connected: wsConnected } = useWebSocket(handleNewLog);

  // Generate sample logs for testing with new schema
  const generateSampleLogs = async () => {
    const sampleLogs = [
      {
        level: 'error',
        message: 'Database connection failed: Connection timeout after 30 seconds',
        resourceId: 'db-server-01',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        traceId: 'trace-db-001',
        spanId: 'span-conn-001',
        commit: '5e5342f',
        metadata: {
          parentResourceId: 'load-balancer-01',
          retryCount: 3,
          connectionPool: 'main-pool'
        }
      },
      {
        level: 'warn',
        message: 'High memory usage detected: 85% of available memory in use',
        resourceId: 'app-server-02',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        traceId: 'trace-memory-001',
        spanId: 'span-monitor-001',
        commit: '7a8b9c1',
        metadata: {
          parentResourceId: 'monitoring-service',
          memoryThreshold: 80,
          currentUsage: 85
        }
      },
      {
        level: 'info',
        message: 'User authentication successful: user@example.com logged in',
        resourceId: 'auth-service-01',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        traceId: 'trace-auth-001',
        spanId: 'span-login-001',
        commit: '3f4e5d2',
        metadata: {
          parentResourceId: 'api-gateway',
          userId: 'user-123',
          authMethod: 'jwt'
        }
      },
      {
        level: 'error',
        message: 'API rate limit exceeded: Too many requests from IP 192.168.1.100',
        resourceId: 'api-gateway-01',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        traceId: 'trace-rate-001',
        spanId: 'span-limit-001',
        commit: '9g0h1i3',
        metadata: {
          parentResourceId: 'load-balancer-01',
          clientIP: '192.168.1.100',
          rateLimit: 100,
          currentCount: 101
        }
      },
      {
        level: 'info',
        message: 'Backup job completed successfully: 2.5GB of data backed up',
        resourceId: 'backup-service-01',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        traceId: 'trace-backup-001',
        spanId: 'span-job-001',
        commit: '2j3k4l5',
        metadata: {
          parentResourceId: 'scheduler-service',
          backupSize: '2.5GB',
          backupType: 'incremental',
          duration: '15m'
        }
      },
      {
        level: 'warn',
        message: 'SSL certificate expires in 30 days: www.example.com',
        resourceId: 'ssl-monitor-01',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        traceId: 'trace-ssl-001',
        spanId: 'span-check-001',
        commit: '6m7n8o9',
        metadata: {
          parentResourceId: 'monitoring-service',
          domain: 'www.example.com',
          daysUntilExpiry: 30,
          certificateType: 'wildcard'
        }
      },
      {
        level: 'error',
        message: 'Critical: Disk space at 95% on /var/log partition',
        resourceId: 'monitoring-server-01',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        traceId: 'trace-disk-001',
        spanId: 'span-space-001',
        commit: '1p2q3r4',
        metadata: {
          parentResourceId: 'monitoring-service',
          partition: '/var/log',
          usagePercent: 95,
          availableSpace: '500MB'
        }
      },
      {
        level: 'info',
        message: 'Scheduled maintenance completed: All systems operational',
        resourceId: 'maintenance-bot-01',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        traceId: 'trace-maint-001',
        spanId: 'span-complete-001',
        commit: '5s6t7u8',
        metadata: {
          parentResourceId: 'scheduler-service',
          maintenanceType: 'routine',
          duration: '2h',
          systemsAffected: ['web', 'api', 'database']
        }
      }
    ];

    for (const log of sampleLogs) {
      try {
        await fetch('/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(log)
        });
      } catch (error) {
        console.error('Error creating sample log:', error);
      }
    }

    // Refresh logs and stats
    fetchLogs();
  };

  // Load initial data
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Update stats when logs change
  useEffect(() => {
    const newStats = calculateStats(logs);
    setStats(newStats);
  }, [logs, calculateStats]);

  // Auto-apply filters when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300); // Debounce filter changes

    return () => clearTimeout(timeoutId);
  }, [filters, applyFilters]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get level icon
  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <AlertCircle size={16} />;
      case 'warn':
        return <AlertTriangle size={16} />;
      case 'info':
        return <Info size={16} />;
      case 'debug':
        return <Database size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <h1>Evallo</h1>
              <p>Log Management System</p>
            </div>
            <div className="header-right">
              <div className="header-controls">
                <div className="ws-status">
                  <span className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
                    {wsConnected ? '🔌' : '❌'}
                  </span>
                  <span className="status-text">
                    {wsConnected ? 'Real-time Connected' : 'Real-time Disconnected'}
                  </span>
                </div>
                <button 
                  className={`btn ${showAnalytics ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowAnalytics(!showAnalytics)}
                >
                  <BarChart3 size={16} />
                  {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                </button>
                <button className="btn btn-secondary" onClick={generateSampleLogs}>
                  Generate Sample Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {/* Statistics Cards */}
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <MessageSquare size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.total}</h3>
                  <p>Total Logs</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon error">
                  <AlertCircle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.byLevel.error}</h3>
                  <p>Errors</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon warning">
                  <AlertTriangle size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.byLevel.warn}</h3>
                  <p>Warnings</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon info">
                  <Info size={24} />
                </div>
                <div className="stat-content">
                  <h3>{stats.byLevel.info}</h3>
                  <p>Info</p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="filter-bar card">
            <div className="filter-header">
              <Filter size={20} />
              <h2>Filters</h2>
            </div>
            
            <div className="filter-grid">
              <div className="filter-group">
                <label htmlFor="message">Search Message</label>
                <div className="input-with-icon">
                  <Search size={16} />
                  <input
                    id="message"
                    type="text"
                    className="input"
                    placeholder="Search in log messages..."
                    value={filters.message}
                    onChange={(e) => handleFilterChange('message', e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label htmlFor="level">Log Level</label>
                <select
                  id="level"
                  className="select"
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                >
                  <option value="">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="resourceId">Resource ID</label>
                <div className="input-with-icon">
                  <Server size={16} />
                  <input
                    id="resourceId"
                    type="text"
                    className="input"
                    placeholder="Filter by resource..."
                    value={filters.resourceId}
                    onChange={(e) => handleFilterChange('resourceId', e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label htmlFor="timestamp_start">Start Time</label>
                <div className="input-with-icon">
                  <Clock size={16} />
                  <input
                    id="timestamp_start"
                    type="datetime-local"
                    className="input"
                    value={filters.timestamp_start}
                    onChange={(e) => handleFilterChange('timestamp_start', e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label htmlFor="timestamp_end">End Time</label>
                <div className="input-with-icon">
                  <Clock size={16} />
                  <input
                    id="timestamp_end"
                    type="datetime-local"
                    className="input"
                    value={filters.timestamp_end}
                    onChange={(e) => handleFilterChange('timestamp_end', e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label htmlFor="traceId">Trace ID</label>
                <div className="input-with-icon">
                  <Hash size={16} />
                  <input
                    id="traceId"
                    type="text"
                    className="input"
                    placeholder="Filter by trace ID..."
                    value={filters.traceId}
                    onChange={(e) => handleFilterChange('traceId', e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label htmlFor="spanId">Span ID</label>
                <div className="input-with-icon">
                  <Hash size={16} />
                  <input
                    id="spanId"
                    type="text"
                    className="input"
                    placeholder="Filter by span ID..."
                    value={filters.spanId}
                    onChange={(e) => handleFilterChange('spanId', e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label htmlFor="commit">Commit Hash</label>
                <div className="input-with-icon">
                  <GitCommit size={16} />
                  <input
                    id="commit"
                    type="text"
                    className="input"
                    placeholder="Filter by commit..."
                    value={filters.commit}
                    onChange={(e) => handleFilterChange('commit', e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>&nbsp;</label>
                <button className="btn btn-secondary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Logs Display */}
          <div className="logs-section">
            <div className="logs-header">
              <h2>Logs ({filteredLogs.length})</h2>
              {loading && <div className="loading">Loading...</div>}
            </div>

            {filteredLogs.length === 0 ? (
              <div className="no-logs card">
                <p>No logs found matching your filters.</p>
                <button className="btn btn-primary" onClick={() => fetchLogs()}>
                  View All Logs
                </button>
              </div>
            ) : (
              <div className="logs-container">
                {filteredLogs.map((log) => (
                  <div key={log.id} className={`log-entry card ${log.level}`}>
                    <div className="log-header">
                      <div className="log-level">
                        {getLevelIcon(log.level)}
                        <span className={`badge badge-${log.level}`}>
                          {log.level}
                        </span>
                      </div>
                      <div className="log-meta">
                        <span className="log-timestamp">
                          <Clock size={14} />
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="log-resource">
                          <Server size={14} />
                          {log.resourceId}
                        </span>
                      </div>
                    </div>
                    <div className="log-message">
                      {log.message}
                    </div>
                    <div className="log-details">
                      <div className="log-identifiers">
                        <span className="log-id">
                          <Hash size={12} />
                          Trace: {log.traceId}
                        </span>
                        <span className="log-id">
                          <Hash size={12} />
                          Span: {log.spanId}
                        </span>
                        <span className="log-id">
                          <GitCommit size={12} />
                          Commit: {log.commit}
                        </span>
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="log-metadata">
                          <strong>Metadata:</strong>
                          <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                    <div className="log-footer">
                      <small>ID: {log.id} • Ingested: {formatTimestamp(log.ingestedAt)}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analytics Dashboard */}
          {showAnalytics && (
            <Analytics logs={filteredLogs} filters={filters} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App; 