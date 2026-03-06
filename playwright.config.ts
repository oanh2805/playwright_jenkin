import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { EnvUtils } from './src/utils/env.utils';
 
/**
 * Playwright Configuration for Levents E2E Testing
 * Supports multiple environments, Allure reporting, and enhanced error handling
 *
 * @see https://playwright.dev/docs/test-configuration
 */
 
// Initialize environment utilities
const envUtils = EnvUtils.getInstance();
 
export default defineConfig({
  // Test directory configuration
  testDir: './src/tests',
 
  // Global test timeout (30 minutes)
  globalTimeout: 30 * 60 * 1000,
 
  // Individual test timeout from environment or default 2 minutes
  timeout: envUtils.getNumber('TEST_TIMEOUT', 2 * 60 * 1000),
 
  // Expect assertion timeout
  expect: {
    timeout: envUtils.getNumber('EXPECT_TIMEOUT', 10 * 1000)
  },
 
  // Run tests in files in parallel
  fullyParallel: true,
 
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
 
  // Retry configuration - no retries, failed tests stay failed
  retries: 0,
 
  // Run 3 browser projects concurrently by default
  workers: 3,
 
  // Enhanced reporter configuration with Allure integration
  reporter: [
    // Built-in HTML reporter for local development
    ['html', {
      outputFolder: 'test-results/html-report',
      open: envUtils.getBoolean('OPEN_REPORT', false) ? 'always' : 'never'
    }],
   
    // Allure reporter for comprehensive reporting
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: 'Levents E2E Test Suite'
    }],
   
    // List reporter for console output
    ['list', { printSteps: true }],
   
    // JUnit reporter for CI integration
    ['junit', { outputFile: 'test-results/junit-report.xml' }],
   
    // JSON reporter for programmatic access
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
 
  // Global test configuration
  use: {
    // Base URL from environment configuration
    baseURL: envUtils.getBaseUrl(),
   
    // Browser context options
    viewport: {
      width: envUtils.getNumber('VIEWPORT_WIDTH', 1920),
      height: envUtils.getNumber('VIEWPORT_HEIGHT', 1080)
    },
   
    // Enable tracing on retry attempts and first failure
    trace: envUtils.getBoolean('ENABLE_TRACE', true) ? 'on-first-retry' : 'off',
   
    // Screenshot configuration - capture on failure and first retry
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
   
    // Video recording configuration - always keep videos for failed tests
    video: {
      mode: 'retain-on-failure',
      size: { width: 1920, height: 1080 }
    },
   
    // Action timeout
    actionTimeout: envUtils.getNumber('ACTION_TIMEOUT', 15 * 1000),
   
    // Navigation timeout
    navigationTimeout: envUtils.getNumber('NAVIGATION_TIMEOUT', 30 * 1000),
   
    // Ignore HTTPS errors for testing environments
    ignoreHTTPSErrors: envUtils.getBoolean('IGNORE_HTTPS_ERRORS', true),
   
    // Accept downloads
    acceptDownloads: true,
   
    // Locale for testing
    locale: envUtils.get('LOCALE', 'vi-VN'),
   
    // Timezone
    timezoneId: envUtils.get('TIMEZONE', 'Asia/Ho_Chi_Minh'),
   
    // User agent
    userAgent: envUtils.get('USER_AGENT', 'Playwright-E2E-Tests'),
   
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
    },
   
    // Permissions
    permissions: ['geolocation', 'notifications'],
   
    // Geolocation for Vietnam
    geolocation: {
      latitude: 10.8231,
      longitude: 106.6297 // Ho Chi Minh City coordinates
    }
  },
 
  // Project configuration for 3 desktop browsers
  projects: [
 
    // Firefox Desktop  
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          slowMo: envUtils.getNumber('SLOW_MO', 0)
        }
      },
    },
 
    // WebKit Desktop (Safari)
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          slowMo: envUtils.getNumber('SLOW_MO', 0)
        }
      },
    },
 
   
  ],
 
  // Output directories
  outputDir: 'test-results/artifacts',
 
  // Test result metadata
  metadata: {
    testFramework: 'Playwright + TypeScript',
    application: 'Levents E-commerce',
    environment: envUtils.get('ENV_NAME', 'default'),
    baseUrl: envUtils.getBaseUrl(),
    executionDate: new Date().toISOString(),
    nodeVersion: process.version,
    playwrightVersion: require('@playwright/test/package.json').version
  },
});