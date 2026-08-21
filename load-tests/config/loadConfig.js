/**
 * load-tests/config/loadConfig.js
 * Baseline & High-Concurrency Load Testing Configuration for SPORTiX.
 */

const path = require('path');

module.exports = {
  // Concurrency & Duration
  concurrency: parseInt(process.env.VUS || '100', 10), // 100 Virtual Users (VUs)
  durationSeconds: parseInt(process.env.DURATION || '60', 10), // 60 Seconds (1 minute continuous)
  rampUpSeconds: 2, // 2s initial ramp-up

  // Base URLs
  webBaseUrl: process.env.WEB_URL || 'http://localhost:5173',
  apiBaseUrl: process.env.API_URL || 'http://localhost:8000',

  // Target Endpoint Matrix
  endpoints: [
    { name: 'Web Landing Page', service: 'Frontend', path: '/', baseUrl: 'http://localhost:5173', method: 'GET', weight: 20 },
    { name: 'Web Login Route', service: 'Frontend', path: '/login', baseUrl: 'http://localhost:5173', method: 'GET', weight: 10 },
    { name: 'Web Feed Page', service: 'Frontend', path: '/app/feed', baseUrl: 'http://localhost:5173', method: 'GET', weight: 15 },
    { name: 'Web ClashHub Events', service: 'Frontend', path: '/app/events', baseUrl: 'http://localhost:5173', method: 'GET', weight: 15 },
    { name: 'Web PULSE Lobby', service: 'Frontend', path: '/pulse', baseUrl: 'http://localhost:5173', method: 'GET', weight: 10 },
    { name: 'Backend Health / Docs', service: 'FastAPI', path: '/docs', baseUrl: 'http://localhost:8000', method: 'GET', weight: 15 },
    { name: 'Backend OpenAPI Schema', service: 'FastAPI', path: '/openapi.json', baseUrl: 'http://localhost:8000', method: 'GET', weight: 15 },
  ],

  // Reporting Paths
  reportsDir: path.resolve(__dirname, '../reports'),
  reportFileName: 'SPORTIX_BASELINE_LOAD_TEST_REPORT.xlsx',
};
