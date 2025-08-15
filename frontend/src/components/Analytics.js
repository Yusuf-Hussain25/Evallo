import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, AlertTriangle, Info, Database } from 'lucide-react';
import './Analytics.css';

const Analytics = ({ logs, filters }) => {
  const analyticsData = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    // Count logs by level
    const levelCounts = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});

    // Count logs by resource
    const resourceCounts = logs.reduce((acc, log) => {
      acc[log.resourceId] = (acc[log.resourceId] || 0) + 1;
      return acc;
    }, {});

    // Count logs by hour (for time-based analysis)
    const hourlyCounts = logs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Prepare data for charts
    const levelData = Object.entries(levelCounts).map(([level, count]) => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      count,
      color: getLevelColor(level)
    }));

    const resourceData = Object.entries(resourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 resources
      .map(([resource, count]) => ({
        resource: resource.length > 20 ? resource.substring(0, 20) + '...' : resource,
        count
      }));

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      count: hourlyCounts[hour] || 0
    }));

    return {
      levelData,
      resourceData,
      hourlyData,
      totalLogs: logs.length,
      levelCounts,
      resourceCounts
    };
  }, [logs]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'debug': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return <AlertCircle size={16} />;
      case 'warn': return <AlertTriangle size={16} />;
      case 'info': return <Info size={16} />;
      case 'debug': return <Database size={16} />;
      default: return <Info size={16} />;
    }
  };

  if (!analyticsData) {
    return (
      <div className="analytics-container">
        <div className="analytics-header">
          <h3>Analytics Dashboard</h3>
          <p>No logs available for analysis</p>
        </div>
      </div>
    );
  }

  const { levelData, resourceData, hourlyData, totalLogs, levelCounts } = analyticsData;

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h3>Analytics Dashboard</h3>
        <div className="analytics-summary">
          <span className="summary-item">
            <strong>Total Logs:</strong> {totalLogs}
          </span>
          <span className="summary-item">
            <strong>Time Range:</strong> {filters.timestamp_start ? 'Filtered' : 'All Time'}
          </span>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Log Levels Chart */}
        <div className="chart-card">
          <h4>Log Distribution by Level</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={levelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="level-breakdown">
            {Object.entries(levelCounts).map(([level, count]) => (
              <div key={level} className="level-item">
                {getLevelIcon(level)}
                <span className="level-name">{level}</span>
                <span className="level-count">{count}</span>
                <span className="level-percentage">
                  {((count / totalLogs) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Distribution Chart */}
        <div className="chart-card">
          <h4>Log Activity by Hour</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Resources Chart */}
        <div className="chart-card">
          <h4>Top Resources by Log Count</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={resourceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="resource" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart for Log Levels */}
        <div className="chart-card">
          <h4>Log Level Distribution</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={levelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ level, count }) => `${level}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {levelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 