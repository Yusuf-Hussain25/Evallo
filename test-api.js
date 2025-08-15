#!/usr/bin/env node

/**
 * Test script for the Evallo Log Ingestion API
 * Run this script to test the backend API endpoints
 * Updated for new API schema with traceId, spanId, commit, and metadata
 */

const API_BASE = 'http://localhost:5000';

// Sample log data with new required fields
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

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing health check...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testLogIngestion() {
  console.log('\n📝 Testing log ingestion...');
  let successCount = 0;
  
  for (const log of sampleLogs) {
    try {
      const response = await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Log ingested: ${log.level} - ${log.message.substring(0, 50)}...`);
        successCount++;
      } else {
        const error = await response.json();
        console.error(`❌ Failed to ingest log:`, error);
      }
    } catch (error) {
      console.error(`❌ Error ingesting log:`, error.message);
    }
  }
  
  console.log(`📊 Successfully ingested ${successCount}/${sampleLogs.length} logs`);
  return successCount;
}

async function testLogQuerying() {
  console.log('\n🔍 Testing log querying...');
  
  try {
    // Test basic query
    const response = await fetch(`${API_BASE}/logs`);
    const data = await response.json();
    console.log(`✅ Basic query: Found ${data.length} logs`);
    
    // Test filtered query by level and message
    const filteredResponse = await fetch(`${API_BASE}/logs?level=error&message=database`);
    const filteredData = await filteredResponse.json();
    console.log(`✅ Filtered query (error + database): Found ${filteredData.length} logs`);
    
    // Test time range query
    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    const timeResponse = await fetch(`${API_BASE}/logs?timestamp_start=${oneHourAgo}`);
    const timeData = await timeResponse.json();
    console.log(`✅ Time range query (last hour): Found ${timeData.length} logs`);
    
    // Test trace ID filtering
    const traceResponse = await fetch(`${API_BASE}/logs?traceId=trace-db-001`);
    const traceData = await traceResponse.json();
    console.log(`✅ Trace ID filter: Found ${traceData.length} logs`);
    
    // Test commit filtering
    const commitResponse = await fetch(`${API_BASE}/logs?commit=5e5342f`);
    const commitData = await commitResponse.json();
    console.log(`✅ Commit filter: Found ${commitData.length} logs`);
    
    return true;
  } catch (error) {
    console.error('❌ Log querying failed:', error.message);
    return false;
  }
}

async function testInvalidLog() {
  console.log('\n🚫 Testing invalid log validation...');
  
  const invalidLogs = [
    {
      level: 'invalid',
      message: 'This should fail validation',
      // Missing required fields
    },
    {
      level: 'error',
      message: 'Missing fields test',
      resourceId: 'test-server',
      timestamp: 'invalid-date',
      traceId: 'test-trace',
      spanId: 'test-span',
      commit: 'test-commit',
      metadata: 'not-an-object' // Should be object
    }
  ];
  
  let passedTests = 0;
  
  for (const invalidLog of invalidLogs) {
    try {
      const response = await fetch(`${API_BASE}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidLog)
      });
      
      if (response.status === 400) {
        const error = await response.json();
        console.log(`✅ Invalid log properly rejected: ${error.error}`);
        passedTests++;
      } else {
        console.error(`❌ Invalid log was not properly rejected`);
      }
    } catch (error) {
      console.error(`❌ Error testing invalid log:`, error.message);
    }
  }
  
  return passedTests === invalidLogs.length;
}

// Test JSON file persistence
async function testPersistence() {
  console.log('\n💾 Testing JSON file persistence...');
  
  try {
    // First, get all logs
    const response1 = await fetch(`${API_BASE}/logs`);
    const logs1 = await response1.json();
    const initialCount = logs1.length;
    
    // Add a new log
    const newLog = {
      level: 'debug',
      message: 'Persistence test log entry',
      resourceId: 'test-server',
      timestamp: new Date().toISOString(),
      traceId: 'trace-persist-001',
      spanId: 'span-persist-001',
      commit: 'test123',
      metadata: {
        test: true,
        purpose: 'persistence-testing'
      }
    };
    
    const postResponse = await fetch(`${API_BASE}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    });
    
    if (postResponse.ok) {
      // Get logs again to verify persistence
      const response2 = await fetch(`${API_BASE}/logs`);
      const logs2 = await response2.json();
      const newCount = logs2.length;
      
      if (newCount === initialCount + 1) {
        console.log('✅ JSON file persistence working correctly');
        return true;
      } else {
        console.error(`❌ Persistence failed: expected ${initialCount + 1} logs, got ${newCount}`);
        return false;
      }
    } else {
      console.error('❌ Failed to create test log for persistence test');
      return false;
    }
  } catch (error) {
    console.error('❌ Persistence test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Evallo API Tests (Updated Schema)...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Log Ingestion', fn: testLogIngestion },
    { name: 'Log Querying', fn: testLogQuerying },
    { name: 'Invalid Log Validation', fn: testInvalidLog },
    { name: 'JSON File Persistence', fn: testPersistence }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result !== false) {
        passed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed with error:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The API is working correctly with JSON file persistence.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Open http://localhost:3000 in your browser');
  console.log('   2. View the logs in the React frontend');
  console.log('   3. Try the filtering and search features');
  console.log('   4. Check the backend/logs.json file to see persisted data');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testLogIngestion,
  testLogQuerying,
  testInvalidLog,
  testPersistence,
  runTests
}; 