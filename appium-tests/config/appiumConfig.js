/**
 * appium-tests/config/appiumConfig.js
 * Central configuration & Android capabilities for SPORTiX Appium Mobile Automation.
 */

const path = require('path');

module.exports = {
  host: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',
    'appium:platformVersion': process.env.PLATFORM_VERSION || '14.0',
    'appium:appPackage': 'com.sportix.app',
    'appium:appActivity': '.MainActivity',
    'appium:noReset': true,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 180,
    'appium:autoGrantPermissions': true,
    'appium:ensureWebviewsHavePages': true,
    'appium:nativeWebScreenshot': true,
  },
  timeouts: {
    implicit: 8000,
    command: 30000,
  },
  reportsDir: path.resolve(__dirname, '../reports'),
  reportFileName: 'SPORTIX_MOBILE_E2E_APPIUM_REPORT.xlsx',
};
