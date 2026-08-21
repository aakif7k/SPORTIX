/**
 * selenium-tests/utils/driverFactory.js
 * Creates and configures the Selenium WebDriver instance.
 */

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const config = require('../config/config');

async function createDriver() {
  const options = new chrome.Options();
  
  // Set chrome binary path if available
  if (fs.existsSync(config.chromeBinaryPath)) {
    options.setChromeBinaryPath(config.chromeBinaryPath);
  }

  // Modern Headless and sandboxing flags for high stability
  if (config.headless) {
    options.addArguments('--headless=new');
  }
  options.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--disable-notifications',
    '--disable-extensions',
    '--ignore-certificate-errors',
    '--log-level=3'
  );

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({
    implicit: 5000,
    pageLoad: config.pageLoadTimeout,
    script: 10000,
  });

  return driver;
}

module.exports = { createDriver };
