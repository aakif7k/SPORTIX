/**
 * load-tests/index.js
 * Master Entry Point for SPORTiX Baseline & Load Testing (100 VUs, 60s Duration).
 */

const { LoadEngine } = require('./engine/loadEngine');
const { generateLoadReport } = require('./utils/loadReporter');

async function main() {
  console.log(`
  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                                                                           ║
  ║     ⚡ SPORTiX ENTERPRISE BASELINE & HIGH-CONCURRENCY LOAD TESTING        ║
  ║           100 VIRTUAL USERS  •  60 SECONDS CONTINUOUS LOAD TEST           ║
  ║                                                                           ║
  ╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  console.log('🎯 Test Parameters:');
  console.log('   • Concurrency:      100 Concurrent Virtual Users (VUs)');
  console.log('   • Target Duration:  60 Seconds (1 minute continuous traffic)');
  console.log('   • Target Endpoints: Web Frontend (http://localhost:5173) & FastAPI (http://localhost:8000)');
  console.log('   • Connection Pool:  HTTP Keep-Alive (maxSockets: 250)');

  const engine = new LoadEngine();
  const stats = await engine.executeLoadTest();

  console.log(`═══════════════════════════════════════════════════════════════════════════`);
  console.log(`🏆 BASELINE LOAD TEST RESULTS SUMMARY:`);
  console.log(`═══════════════════════════════════════════════════════════════════════════`);
  console.log(`   • Total Requests Handled:  ${stats.totalRequests.toLocaleString()}`);
  console.log(`   • Successful Requests:     ${stats.successfulRequests.toLocaleString()}`);
  console.log(`   • Failed Requests:         ${stats.failedRequests}`);
  console.log(`   • Overall Success Rate:    ${stats.successRate.toFixed(2)}%`);
  console.log(`   • Test Duration:           ${stats.duration.toFixed(2)}s`);
  console.log(`   ─────────────────────────────────────────────────────────────────`);
  console.log(`   ⚡ REQUESTS PER SECOND (RPS / Throughput):`);
  console.log(`      Average RPS:            ${stats.averageRps.toFixed(1)} req/sec`);
  console.log(`   ─────────────────────────────────────────────────────────────────`);
  console.log(`   ⏱️  RESPONSE TIME (Latency Breakdown):`);
  console.log(`      Average:                ${stats.latency.avg.toFixed(1)} ms`);
  console.log(`      Min (Fastest):          ${stats.latency.min.toFixed(1)} ms`);
  console.log(`      p50 (Median):           ${stats.latency.p50.toFixed(1)} ms`);
  console.log(`      p75:                    ${stats.latency.p75.toFixed(1)} ms`);
  console.log(`      p90:                    ${stats.latency.p90.toFixed(1)} ms`);
  console.log(`      p95:                    ${stats.latency.p95.toFixed(1)} ms`);
  console.log(`      p99:                    ${stats.latency.p99.toFixed(1)} ms`);
  console.log(`      Max (Slowest):          ${stats.latency.max.toFixed(1)} ms`);
  console.log(`═══════════════════════════════════════════════════════════════════════════\n`);

  console.log(`📊 Endpoint Matrix Breakdown:`);
  console.table(stats.endpointStats.map(ep => ({
    'Endpoint': ep.name,
    'Service': ep.service,
    'Total Reqs': ep.totalRequests,
    'Avg Latency': `${ep.avgLatency.toFixed(1)} ms`,
    'Min Latency': `${ep.minLatency.toFixed(1)} ms`,
    'Max Latency': `${ep.maxLatency.toFixed(1)} ms`,
    'p95 Latency': `${ep.p95Latency.toFixed(1)} ms`,
    'Success %': `${ep.successRate.toFixed(1)}%`,
  })));

  // Generate Excel Report
  const reportPath = await generateLoadReport(stats);

  console.log(`\n🎉 Baseline Load Testing completed successfully!`);
  console.log(`📁 Detailed Excel Report generated at:`);
  console.log(`   ${reportPath}\n`);
}

main().catch(console.error);
