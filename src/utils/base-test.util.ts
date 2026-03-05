import { test as base, Page, BrowserContext, TestInfo } from '@playwright/test';
import { TestUtils } from '../utils/test.utils';
import { EnvUtils } from '../utils/env.utils';

/**
 * Base test class that provides common test setup, teardown, and utilities
 * Extends Playwright's base test with enhanced error handling and reporting
 */
export class BaseTest {
    public page: Page;
    public context: BrowserContext;
    public testInfo: TestInfo;
    public envUtils: EnvUtils;

    /**
     * Constructor for BaseTest
     * @param page - Playwright page instance
     * @param context - Browser context
     * @param testInfo - Test information from Playwright
     */
    constructor(page: Page, context: BrowserContext, testInfo: TestInfo) {
        this.page = page;
        this.context = context;
        this.testInfo = testInfo;
        this.envUtils = EnvUtils.getInstance();
    }

    /**
     * Setup method to be called before each test
     * Configures page settings and initializes test environment
     */
    public async setup(): Promise<void> {
        try {
            // Set page timeout
            const timeout: number = this.envUtils.getNumber('APP_TIMEOUT', 30000);
            this.page.setDefaultTimeout(timeout);
            
            // Configure page settings
            await this.configurePage();
        } catch (error) {
            console.error('Test setup failed:', error);
            throw error;
        }
    }

    /**
     * Teardown method to be called after each test
     * Handles cleanup and captures final screenshots
     */
    public async teardown(): Promise<void> {
        try {
            // Attach error details if test failed (screenshots already captured by Playwright)
            if (this.testInfo.status === 'failed') {
                await this.attachErrorDetails();
            }
            
            // Clean up artifacts if configured
            const cleanupEnabled: boolean = this.envUtils.getBoolean('CLEANUP_ARTIFACTS', false);
            if (cleanupEnabled) {
                await TestUtils.cleanupTestArtifacts(5);
            }
        } catch (error) {
            console.error('Test teardown failed:', error);
            // Don't throw error in teardown to avoid masking original test failure
        }
    }

    /**
     * Configure page with common settings
     */
    private async configurePage(): Promise<void> {
        try {
            // Set viewport size
            await this.page.setViewportSize({ 
                width: this.envUtils.getNumber('VIEWPORT_WIDTH', 1920), 
                height: this.envUtils.getNumber('VIEWPORT_HEIGHT', 1080) 
            });
            
            // Configure request/response logging if enabled
            if (this.envUtils.getBoolean('LOG_REQUESTS', false)) {
                this.page.on('request', (request) => {
                    console.log(`Request: ${request.method()} ${request.url()}`);
                });
                
                this.page.on('response', (response) => {
                    if (!response.ok()) {
                        console.warn(`Failed Response: ${response.status()} ${response.url()}`);
                    }
                });
            }
            
            // Browser/page console forwarding disabled to keep test output clean
        } catch (error) {
            throw new Error(`Failed to configure page: ${error}`);
        }
    }

    /**
     * Capture screenshot with test context
     * @param stepName - Name of the step
     * @returns Screenshot file path
     */
    protected async captureScreenshot(stepName: string): Promise<string> {
        const testName: string = this.testInfo.title.replace(/\s+/g, '_').toLowerCase();
        return await TestUtils.captureScreenshot(this.page, testName, stepName);
    }

    /**
     * Navigate to application base URL
     * @param path - Optional path to append to base URL
     */
    protected async navigateToApp(path: string = ''): Promise<void> {
        try {
            const baseUrl: string = this.envUtils.getBaseUrl();
            const fullUrl: string = path ? `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}` : baseUrl;
            
            console.log(`Navigating to application: ${fullUrl}`);
            await this.page.goto(fullUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: this.envUtils.getNumber('APP_TIMEOUT', 30000)
            });
            
            await TestUtils.waitForPageLoad(this.page);
        } catch (error) {
            await this.captureScreenshot('navigation_error');
            throw new Error(`Failed to navigate to application: ${error}`);
        }
    }

    /**
     * Execute test step with error handling and logging
     * @param stepName - Name of the test step
     * @param stepAction - Action to execute
     * @param captureScreenshot - Whether to capture screenshot after step
     */
    protected async executeStep<T>(
        stepName: string,
        stepAction: () => Promise<T>,
        captureScreenshot: boolean = false
    ): Promise<T> {
        try {
            console.log(`Executing step: ${stepName}`);
            const result: T = await stepAction();
            
            if (captureScreenshot) {
                await this.captureScreenshot(stepName.replace(/\s+/g, '_').toLowerCase());
            }
            
            console.log(`Step completed: ${stepName}`);
            return result;
        } catch (error) {
            await this.captureScreenshot(`${stepName.replace(/\s+/g, '_').toLowerCase()}_error`);
            throw new Error(`Step '${stepName}' failed: ${error}`);
        }
    }

    /**
     * Attach error details to test report
     */
    private async attachErrorDetails(): Promise<void> {
        try {
            // Attach page URL
            await this.testInfo.attach('Current URL', {
                body: this.page.url(),
                contentType: 'text/plain'
            });
            
            // Attach page title
            const title: string = await this.page.title();
            await this.testInfo.attach('Page Title', {
                body: title,
                contentType: 'text/plain'
            });
            
            // Attach console messages if available
            // Note: Console messages would need to be collected during test execution
            
            // Attach network requests if logging is enabled
            if (this.envUtils.getBoolean('LOG_REQUESTS', false)) {
                // Network logs would be attached here if collected
            }
        } catch (error) {
            console.warn(`Failed to attach error details: ${error}`);
        }
    }

    /**
     * Wait for application to be ready
     * Override this method in specific test classes for custom readiness checks
     */
    protected async waitForApplicationReady(): Promise<void> {
        await TestUtils.waitForPageLoad(this.page);
    }

    /**
     * Get test credentials from environment
     * @returns Test user credentials
     */
    public getTestCredentials(): { phone: string; password: string } {
        return this.envUtils.getTestCredentials();
    }

    /**
     * Get browser configuration
     * @returns Browser configuration settings
     */
    public getBrowserConfig(): { 
        browser: string; 
        headed: boolean; 
        slowMo: number; 
        timeout: number 
    } {
        return this.envUtils.getBrowserConfig();
    }

    /**
     * Log test information
     * @param message - Message to log
     * @param level - Log level (info, warn, error)
     */
    protected log(
        message: string, 
        level: 'info' | 'warn' | 'error' = 'info'
    ): void {
        const timestamp: string = new Date().toISOString();
        const testName: string = this.testInfo.title;
        const logMessage: string = `[${timestamp}] [${testName}] ${message}`;
        
        switch (level) {
            case 'error':
                console.error(`${logMessage}`);
                break;
            case 'warn':
                console.warn(`${logMessage}`);
                break;
            default:
                console.log(` ${logMessage}`);
        }
    }
}