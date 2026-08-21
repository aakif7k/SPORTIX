/**
 * load-tests/engine/loadEngine.js
 * High-Throughput Asynchronous Multi-Worker Load Generator for SPORTiX (100 VUs, 60s).
 */

const http = require('http');
const config = require('../config/loadConfig');

class LoadEngine {
  constructor() {
    this.concurrency = config.concurrency; // 100 VUs
    this.durationSeconds = config.durationSeconds; // 60s
    this.endpoints = config.endpoints;

    this.httpAgent = new http.Agent({
      keepAlive: true,
      maxSockets: 250,
      maxFreeSockets: 50,
      timeout: 10000,
    });

    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.allLatencies = [];
    this.sampleLogs = [];

    this.endpointMetrics = new Map();
    this.endpoints.forEach((ep) => {
      this.endpointMetrics.set(ep.name, {
        name: ep.name,
        service: ep.service,
        path: ep.path,
        method: ep.method,
        totalRequests: 0,
        successes: 0,
        errors: 0,
        latencies: [],
      });
    });

    this.secondBySecond = [];
    this.currentSecondBucket = {
      second: 1,
      vus: this.concurrency,
      requests: 0,
      successes: 0,
      errors: 0,
      latencies: [],
    };
  }

  getRandomEndpoint() {
    const totalWeight = this.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let randomNum = Math.random() * totalWeight;
    for (const ep of this.endpoints) {
      if (randomNum < ep.weight) return ep;
      randomNum -= ep.weight;
    }
    return this.endpoints[0];
  }

  async sendRequest(vuId) {
    const ep = this.getRandomEndpoint();
    const url = `${ep.baseUrl}${ep.path}`;
    const startHr = process.hrtime.bigint();

    return new Promise((resolve) => {
      const parsedUrl = new URL(url);
      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: ep.method,
        agent: this.httpAgent,
        timeout: 5000,
        headers: {
          'User-Agent': `SPORTiX-LoadTester-VU/${vuId}`,
          'Accept': '*/*',
        },
      };

      const req = http.request(reqOptions, (res) => {
        let bodySize = 0;
        res.on('data', (chunk) => { bodySize += chunk.length; });
        res.on('end', () => {
          const endHr = process.hrtime.bigint();
          const latencyMs = Number(endHr - startHr) / 1000000;
          const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

          this.recordRequest({
            vuId,
            ep,
            url,
            statusCode: res.statusCode,
            latencyMs,
            isSuccess,
            bodySize,
          });
          resolve();
        });
      });

      req.on('error', (err) => {
        const endHr = process.hrtime.bigint();
        const latencyMs = Number(endHr - startHr) / 1000000;
        this.recordRequest({
          vuId,
          ep,
          url,
          statusCode: 500,
          latencyMs,
          isSuccess: false,
          bodySize: 0,
          error: err.message,
        });
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        const endHr = process.hrtime.bigint();
        const latencyMs = Number(endHr - startHr) / 1000000;
        this.recordRequest({
          vuId,
          ep,
          url,
          statusCode: 504,
          latencyMs,
          isSuccess: false,
          bodySize: 0,
          error: 'Request Timeout',
        });
        resolve();
      });

      req.end();
    });
  }

  recordRequest({ vuId, ep, url, statusCode, latencyMs, isSuccess, bodySize, error }) {
    this.totalRequests++;
    if (isSuccess) this.successfulRequests++;
    else this.failedRequests++;

    this.allLatencies.push(latencyMs);

    // Endpoint metrics
    const epData = this.endpointMetrics.get(ep.name);
    if (epData) {
      epData.totalRequests++;
      if (isSuccess) epData.successes++;
      else epData.errors++;
      epData.latencies.push(latencyMs);
    }

    // Timeline second bucket
    this.currentSecondBucket.requests++;
    if (isSuccess) this.currentSecondBucket.successes++;
    else this.currentSecondBucket.errors++;
    this.currentSecondBucket.latencies.push(latencyMs);

    // Keep representative sample logs (up to 300 logs)
    if (this.sampleLogs.length < 300 && Math.random() < 0.25) {
      this.sampleLogs.push({
        id: `REQ-${String(this.sampleLogs.length + 1).padStart(4, '0')}`,
        timestamp: new Date().toISOString(),
        vu: `VU-${String(vuId).padStart(3, '0')}`,
        service: ep.service,
        name: ep.name,
        method: ep.method,
        url: ep.path,
        status: statusCode,
        latency: latencyMs,
      });
    }
  }

  calculatePercentile(sortedArr, p) {
    if (sortedArr.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
  }

  async runVU(vuId, stopTime) {
    while (Date.now() < stopTime) {
      await this.sendRequest(vuId);
      // Minimal pacing between 2-10ms for realistic user requests
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 8 + 2)));
    }
  }

  async executeLoadTest() {
    console.log(`\n🚀 Starting Baseline Load Test: ${this.concurrency} Virtual Users for ${this.durationSeconds} Seconds...`);
    const startTime = Date.now();
    const stopTime = startTime + this.durationSeconds * 1000;

    // Timeline ticker (1-second intervals)
    let currentSecond = 1;
    const timelineInterval = setInterval(() => {
      const b = this.currentSecondBucket;
      b.latencies.sort((a, b) => a - b);

      const rps = b.requests;
      const avgLat = b.latencies.length > 0 ? (b.latencies.reduce((a, b) => a + b, 0) / b.latencies.length) : 0;
      const minLat = b.latencies.length > 0 ? b.latencies[0] : 0;
      const maxLat = b.latencies.length > 0 ? b.latencies[b.latencies.length - 1] : 0;
      const p95Lat = this.calculatePercentile(b.latencies, 95);
      const successRate = b.requests > 0 ? ((b.successes / b.requests) * 100) : 100;

      this.secondBySecond.push({
        second: currentSecond,
        vus: this.concurrency,
        requests: b.requests,
        rps: rps,
        avgLatency: avgLat,
        minLatency: minLat,
        p95Latency: p95Lat,
        maxLatency: maxLat,
        successRate: successRate,
        errors: b.errors,
      });

      // Console live ticker
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const progressBar = '█'.repeat(Math.min(25, Math.floor((elapsed / this.durationSeconds) * 25))) + '░'.repeat(Math.max(0, 25 - Math.floor((elapsed / this.durationSeconds) * 25)));
      process.stdout.write(`\r⏱️  [${progressBar}] ${elapsed}/${this.durationSeconds}s | 👥 VUs: ${this.concurrency} | ⚡ RPS: ${rps.toString().padStart(4)} req/s | 📊 Total: ${this.totalRequests.toLocaleString()} | ⚡ Avg: ${avgLat.toFixed(1)}ms | Min: ${minLat.toFixed(1)}ms | Max: ${maxLat.toFixed(1)}ms`);

      currentSecond++;
      this.currentSecondBucket = {
        second: currentSecond,
        vus: this.concurrency,
        requests: 0,
        successes: 0,
        errors: 0,
        latencies: [],
      };
    }, 1000);

    // Launch 100 concurrent VUs
    const vuPromises = [];
    for (let i = 1; i <= this.concurrency; i++) {
      vuPromises.push(this.runVU(i, stopTime));
    }

    await Promise.all(vuPromises);
    clearInterval(timelineInterval);
    process.stdout.write('\n\n');

    const totalDurationSec = (Date.now() - startTime) / 1000;
    this.allLatencies.sort((a, b) => a - b);

    // Compile global stats
    const avgLatency = this.allLatencies.length > 0 ? (this.allLatencies.reduce((a, b) => a + b, 0) / this.allLatencies.length) : 0;
    const minLatency = this.allLatencies.length > 0 ? this.allLatencies[0] : 0;
    const maxLatency = this.allLatencies.length > 0 ? this.allLatencies[this.allLatencies.length - 1] : 0;

    const endpointStats = [];
    this.endpointMetrics.forEach((ep) => {
      ep.latencies.sort((a, b) => a - b);
      const epAvg = ep.latencies.length > 0 ? (ep.latencies.reduce((a, b) => a + b, 0) / ep.latencies.length) : 0;
      const epMin = ep.latencies.length > 0 ? ep.latencies[0] : 0;
      const epMax = ep.latencies.length > 0 ? ep.latencies[ep.latencies.length - 1] : 0;
      const epP95 = this.calculatePercentile(ep.latencies, 95);
      const epSuccessRate = ep.totalRequests > 0 ? ((ep.successes / ep.totalRequests) * 100) : 100;

      endpointStats.push({
        name: ep.name,
        service: ep.service,
        path: ep.path,
        method: ep.method,
        totalRequests: ep.totalRequests,
        successes: ep.successes,
        errors: ep.errors,
        avgLatency: epAvg,
        minLatency: epMin,
        maxLatency: epMax,
        p95Latency: epP95,
        successRate: epSuccessRate,
      });
    });

    return {
      concurrency: this.concurrency,
      duration: totalDurationSec,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate: this.totalRequests > 0 ? ((this.successfulRequests / this.totalRequests) * 100) : 100,
      averageRps: this.totalRequests / totalDurationSec,
      latency: {
        min: minLatency,
        p50: this.calculatePercentile(this.allLatencies, 50),
        p75: this.calculatePercentile(this.allLatencies, 75),
        p90: this.calculatePercentile(this.allLatencies, 90),
        p95: this.calculatePercentile(this.allLatencies, 95),
        p99: this.calculatePercentile(this.allLatencies, 99),
        max: maxLatency,
        avg: avgLatency,
      },
      endpointStats,
      secondBySecond: this.secondBySecond,
      sampleLogs: this.sampleLogs,
    };
  }
}

module.exports = { LoadEngine };
