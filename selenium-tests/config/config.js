/**
 * selenium-tests/config/config.js
 * Central configuration for SPORTiX Selenium E2E test suite.
 */

const path = require('path');

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:8000',
  defaultTimeout: 15000,
  pageLoadTimeout: 20000,
  headless: process.env.HEADLESS !== 'false', // Headless by default
  chromeBinaryPath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  reportsDir: path.resolve(__dirname, '../reports'),
  reportFileName: 'SPORTIX_WEB_E2E_AUTOMATION_REPORT.xlsx',
};
