/**
 * Unit tests for the backend filtering logic
 * Tests various combinations of filters and edge cases
 */

// Mock sample logs for testing
const mockLogs = [
  {
    id: '1',
    level: 'error',
    message: 'Database connection failed',
    resourceId: 'db-server-01',
    timestamp: '2024-01-01T10:00:00Z',
    traceId: 'trace-001',
    spanId: 'span-001',
    commit: 'abc123',
    metadata: { retryCount: 3 }
  },
  {
    id: '2',
    level: 'warn',
    message: 'High memory usage detected',
    resourceId: 'app-server-01',
    timestamp: '2024-01-01T11:00:00Z',
    traceId: 'trace-002',
    spanId: 'span-002',
    commit: 'def456',
    metadata: { memoryUsage: 85 }
  },
  {
    id: '3',
    level: 'info',
    message: 'User authentication successful',
    resourceId: 'auth-service-01',
    timestamp: '2024-01-01T12:00:00Z',
    traceId: 'trace-003',
    spanId: 'span-003',
    commit: 'ghi789',
    metadata: { userId: 'user-123' }
  },
  {
    id: '4',
    level: 'error',
    message: 'API rate limit exceeded',
    resourceId: 'api-gateway-01',
    timestamp: '2024-01-01T13:00:00Z',
    traceId: 'trace-004',
    spanId: 'span-004',
    commit: 'jkl012',
    metadata: { clientIP: '192.168.1.100' }
  },
  {
    id: '5',
    level: 'debug',
    message: 'Processing request data',
    resourceId: 'api-gateway-01',
    timestamp: '2024-01-01T14:00:00Z',
    traceId: 'trace-005',
    spanId: 'span-005',
    commit: 'mno345',
    metadata: { requestSize: '2KB' }
  }
];

// Import the filtering logic (we'll need to extract it from server.js)
// For now, let's test the logic directly

describe('Log Filtering Logic', () => {
  
  // Helper function to apply filters (extracted from server logic)
  const applyFilters = (logs, filters) => {
    let filteredLogs = [...logs];
    
    const {
      level,
      message,
      resourceId,
      timestamp_start,
      timestamp_end,
      traceId,
      spanId,
      commit
    } = filters;
    
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
    
    return filteredLogs;
  };

  describe('Single Filter Tests', () => {
    
    test('should filter by level correctly', () => {
      const result = applyFilters(mockLogs, { level: 'error' });
      expect(result).toHaveLength(2);
      expect(result.every(log => log.level === 'error')).toBe(true);
    });

    test('should filter by message correctly (case-insensitive)', () => {
      const result = applyFilters(mockLogs, { message: 'database' });
      expect(result).toHaveLength(1);
      expect(result[0].message.toLowerCase()).toContain('database');
    });

    test('should filter by resourceId correctly', () => {
      const result = applyFilters(mockLogs, { resourceId: 'api-gateway-01' });
      expect(result).toHaveLength(2);
      expect(result.every(log => log.resourceId === 'api-gateway-01')).toBe(true);
    });

    test('should filter by traceId correctly', () => {
      const result = applyFilters(mockLogs, { traceId: 'trace-001' });
      expect(result).toHaveLength(1);
      expect(result[0].traceId).toBe('trace-001');
    });

    test('should filter by spanId correctly', () => {
      const result = applyFilters(mockLogs, { spanId: 'span-002' });
      expect(result).toHaveLength(1);
      expect(result[0].spanId).toBe('span-002');
    });

    test('should filter by commit correctly', () => {
      const result = applyFilters(mockLogs, { commit: 'abc123' });
      expect(result).toHaveLength(1);
      expect(result[0].commit).toBe('abc123');
    });

    test('should filter by timestamp_start correctly', () => {
      const result = applyFilters(mockLogs, { timestamp_start: '2024-01-01T12:00:00Z' });
      expect(result).toHaveLength(3); // 12:00, 13:00, 14:00
      expect(result.every(log => new Date(log.timestamp) >= new Date('2024-01-01T12:00:00Z'))).toBe(true);
    });

    test('should filter by timestamp_end correctly', () => {
      const result = applyFilters(mockLogs, { timestamp_end: '2024-01-01T12:00:00Z' });
      expect(result).toHaveLength(3); // 10:00, 11:00, 12:00
      expect(result.every(log => new Date(log.timestamp) <= new Date('2024-01-01T12:00:00Z'))).toBe(true);
    });
  });

  describe('Combined Filter Tests', () => {
    
    test('should combine level and message filters (AND logic)', () => {
      const result = applyFilters(mockLogs, { 
        level: 'error', 
        message: 'database' 
      });
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('error');
      expect(result[0].message.toLowerCase()).toContain('database');
    });

    test('should combine level and resourceId filters', () => {
      const result = applyFilters(mockLogs, { 
        level: 'error', 
        resourceId: 'api-gateway-01' 
      });
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('error');
      expect(result[0].resourceId).toBe('api-gateway-01');
    });

    test('should combine timestamp range filters', () => {
      const result = applyFilters(mockLogs, { 
        timestamp_start: '2024-01-01T11:00:00Z',
        timestamp_end: '2024-01-01T13:00:00Z'
      });
      expect(result).toHaveLength(3); // 11:00, 12:00, 13:00
      expect(result.every(log => {
        const timestamp = new Date(log.timestamp);
        return timestamp >= new Date('2024-01-01T11:00:00Z') && 
               timestamp <= new Date('2024-01-01T13:00:00Z');
      })).toBe(true);
    });

    test('should combine multiple filters correctly', () => {
      const result = applyFilters(mockLogs, { 
        level: 'error',
        resourceId: 'api-gateway-01',
        message: 'rate limit'
      });
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('error');
      expect(result[0].resourceId).toBe('api-gateway-01');
      expect(result[0].message.toLowerCase()).toContain('rate limit');
    });

    test('should handle trace and span combination', () => {
      const result = applyFilters(mockLogs, { 
        traceId: 'trace-001',
        spanId: 'span-001'
      });
      expect(result).toHaveLength(1);
      expect(result[0].traceId).toBe('trace-001');
      expect(result[0].spanId).toBe('span-001');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    
    test('should return empty array when no logs match filters', () => {
      const result = applyFilters(mockLogs, { 
        level: 'error',
        resourceId: 'non-existent-resource'
      });
      expect(result).toHaveLength(0);
    });

    test('should handle invalid timestamp gracefully', () => {
      const result = applyFilters(mockLogs, { 
        timestamp_start: 'invalid-date'
      });
      expect(result).toHaveLength(5); // Should return all logs
    });

    test('should handle empty filters object', () => {
      const result = applyFilters(mockLogs, {});
      expect(result).toHaveLength(5); // Should return all logs
    });

    test('should handle null/undefined filter values', () => {
      const result = applyFilters(mockLogs, { 
        level: null,
        message: undefined
      });
      expect(result).toHaveLength(5); // Should return all logs
    });

    test('should maintain reverse chronological order', () => {
      const result = applyFilters(mockLogs, { level: 'error' });
      expect(result).toHaveLength(2);
      expect(new Date(result[0].timestamp).getTime()).toBeGreaterThan(new Date(result[1].timestamp).getTime());
    });
  });

  describe('Performance Tests', () => {
    
    test('should handle large number of logs efficiently', () => {
      // Create 1000 mock logs
      const largeLogs = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        level: ['error', 'warn', 'info', 'debug'][i % 4],
        message: `Log message ${i}`,
        resourceId: `resource-${i % 10}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        traceId: `trace-${i}`,
        spanId: `span-${i}`,
        commit: `commit-${i}`,
        metadata: { index: i }
      }));

      const startTime = Date.now();
      const result = applyFilters(largeLogs, { level: 'error' });
      const endTime = Date.now();

      expect(result).toHaveLength(250); // 1000 / 4 levels
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    test('should handle complex filter combinations efficiently', () => {
      const largeLogs = Array.from({ length: 500 }, (_, i) => ({
        id: i.toString(),
        level: ['error', 'warn', 'info', 'debug'][i % 4],
        message: `Log message ${i} with specific text`,
        resourceId: `resource-${i % 20}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        traceId: `trace-${i % 50}`,
        spanId: `span-${i % 50}`,
        commit: `commit-${i % 100}`,
        metadata: { index: i }
      }));

      const startTime = Date.now();
      const result = applyFilters(largeLogs, { 
        level: 'error',
        message: 'specific',
        resourceId: 'resource-5',
        timestamp_start: new Date(Date.now() - 1000000).toISOString()
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    });
  });

  describe('Filter Validation Tests', () => {
    
    test('should handle case-sensitive resourceId matching', () => {
      const result = applyFilters(mockLogs, { resourceId: 'DB-SERVER-01' });
      expect(result).toHaveLength(0); // Should not match 'db-server-01'
    });

    test('should handle case-insensitive message matching', () => {
      const result = applyFilters(mockLogs, { message: 'DATABASE' });
      expect(result).toHaveLength(1); // Should match 'Database connection failed'
    });

    test('should handle partial message matching', () => {
      const result = applyFilters(mockLogs, { message: 'connection' });
      expect(result).toHaveLength(1); // Should match 'Database connection failed'
    });

    test('should handle exact timestamp matching', () => {
      const result = applyFilters(mockLogs, { 
        timestamp_start: '2024-01-01T12:00:00Z',
        timestamp_end: '2024-01-01T12:00:00Z'
      });
      expect(result).toHaveLength(1); // Should match exactly 12:00:00
    });
  });
}); 