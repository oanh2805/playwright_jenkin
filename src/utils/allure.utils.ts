import { allure } from 'allure-playwright';
import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Allure reporting utilities for enhanced test reporting
 * Provides screenshot attachment, step reporting, and test metadata management
 */
export class AllureUtils {
    /**
     * Attach screenshot to Allure report
     * @param page - Playwright page instance  
     * @param screenshotName - Name for the screenshot
     * @param description - Description of the screenshot
     * @returns Screenshot file path
     */
    public static async attachScreenshot(
        page: Page, 
        screenshotName: string = 'screenshot',
        description: string = 'Page Screenshot'
    ): Promise<string> {
        const timestamp: string = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName: string = `${screenshotName}_${timestamp}.png`;
            const screenshotPath: string = path.join('screenshots', fileName);
        try {
            // Ensure screenshots directory exists
            if (!fs.existsSync('screenshots')) {
                fs.mkdirSync('screenshots', { recursive: true });
            }
            
            // Capture screenshot
            const screenshotBuffer: Buffer = await page.screenshot({ 
                fullPage: false,
                type: 'png',
                timeout: 10000,
                animations: "disabled"
            });
            
            // Save to file
            fs.writeFileSync(screenshotPath, screenshotBuffer);
            
            // Attach to Allure report
            await allure.attachment(description, screenshotBuffer, 'image/png');

            return screenshotPath;
        } catch (error) {
            console.error('Failed to attach screenshot to Allure:', error);
            throw error;
        }
    }

    /**
     * Create Allure step with automatic error handling and screenshot
     * @param stepName - Name of the step
     * @param stepAction - Action to execute within the step
     * @param page - Optional page for screenshot on failure
     * @returns Result of the step action
     */
    public static async step<T>(
        stepName: string,
        stepAction: () => Promise<T>,
        page?: Page
    ): Promise<T> {
        try {
            const result = await stepAction();
            
            // Use allure step for reporting
            await allure.step(stepName, async () => {
                // Step completed successfully
            });
            
            return result;
        } catch (error) {
            console.error(`Allure Step Failed: ${stepName}`, error);
            
            // Attach screenshot on failure if page is provided
            if (page) {
                try {
                    await AllureUtils.attachScreenshot(page, 'step_failure', `Failed Step: ${stepName}`);
                } catch (screenshotError) {
                    console.warn('Failed to capture step failure screenshot:', screenshotError);
                }
            }
            
            throw error;
        }
    }

    /**
     * Add test metadata to Allure report
     * @param testInfo - Test information object
     */
    public static addTestMetadata(testInfo: {
        feature?: string;
        story?: string;
        severity?: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
        owner?: string;
        issue?: string;
        tmsLink?: string;
        tags?: string[];
        description?: string;
    }): void {
        try {
            if (testInfo.feature) {
                allure.feature(testInfo.feature);
            }
            
            if (testInfo.story) {
                allure.story(testInfo.story);
            }
            
            if (testInfo.severity) {
                allure.severity(testInfo.severity);
            }
            
            if (testInfo.owner) {
                allure.owner(testInfo.owner);
            }
            
            if (testInfo.issue) {
                allure.issue(testInfo.issue, testInfo.issue);
            }
            
            if (testInfo.tmsLink) {
                allure.tms(testInfo.tmsLink, testInfo.tmsLink);
            }
            
            if (testInfo.tags) {
                testInfo.tags.forEach(tag => {
                    allure.tag(tag);
                });
            }
            
            if (testInfo.description) {
                allure.description(testInfo.description);
            }

        } catch (error) {
            console.warn('Failed to add test metadata to Allure:', error);
        }
    }

    /**
     * Add environment information to Allure report
     * @param environment - Environment configuration
     */
    public static addEnvironmentInfo(environment: {
        browser?: string;
        browserVersion?: string;
        platform?: string;
        baseUrl?: string;
        environment?: string;
        testType?: string;
    }): void {
        try {
            // Create environment properties for Allure
            const envProperties: string[] = [];
            
            if (environment.browser) {
                envProperties.push(`browser=${environment.browser}`);
            }
            
            if (environment.browserVersion) {
                envProperties.push(`browser.version=${environment.browserVersion}`);
            }
            
            if (environment.platform) {
                envProperties.push(`platform=${environment.platform}`);
            }
            
            if (environment.baseUrl) {
                envProperties.push(`base.url=${environment.baseUrl}`);
            }
            
            if (environment.environment) {
                envProperties.push(`environment=${environment.environment}`);
            }
            
            if (environment.testType) {
                envProperties.push(`test.type=${environment.testType}`);
            }
            
            // Add timestamp
            envProperties.push(`execution.date=${new Date().toISOString()}`);
            
            // Write environment.properties file for Allure
            const envPropertiesPath: string = path.join('allure-results', 'environment.properties');
            
            // Ensure allure-results directory exists
            if (!fs.existsSync('allure-results')) {
                fs.mkdirSync('allure-results', { recursive: true });
            }
            
            fs.writeFileSync(envPropertiesPath, envProperties.join('\n'));

        } catch (error) {
            console.warn('Failed to add environment info to Allure:', error);
        }
    }

    /**
     * Add parameter to current test
     * @param name - Parameter name
     * @param value - Parameter value
     */
    public static addParameter(name: string, value: string): void {
        try {
            allure.parameter(name, value);
        } catch (error) {
            console.warn(`Failed to add parameter ${name} to Allure:`, error);
        }
    }

    /**
     * Add attachment to Allure report
     * @param name - Attachment name
     * @param content - Content to attach
     * @param type - MIME type of the content
     */
    public static async addAttachment(
        name: string, 
        content: string | Buffer, 
        type: string = 'text/plain'
    ): Promise<void> {
        try {
            await allure.attachment(name, content, type);
            console.log(`📎 Attachment added to Allure report: ${name}`);
        } catch (error) {
            console.warn(`Failed to add attachment ${name} to Allure:`, error);
        }
    }

    /**
     * Add page HTML source to Allure report
     * @param page - Playwright page instance
     * @param attachmentName - Name for the attachment
     */
    public static async attachPageSource(
        page: Page, 
        attachmentName: string = 'Page Source'
    ): Promise<void> {
        try {
            const pageSource: string = await page.content();
            await AllureUtils.addAttachment(attachmentName, pageSource, 'text/html');
        } catch (error) {
            console.warn('Failed to attach page source to Allure:', error);
        }
    }

    /**
     * Add browser console logs to Allure report
     * @param consoleLogs - Array of console log messages
     */
    public static async attachConsoleLogs(consoleLogs: string[]): Promise<void> {
        try {
            const logsContent: string = consoleLogs.join('\n');
            await AllureUtils.addAttachment('Browser Console Logs', logsContent, 'text/plain');
        } catch (error) {
            console.warn('Failed to attach console logs to Allure:', error);
        }
    }

    /**
     * Add network requests to Allure report
     * @param networkLogs - Array of network request information
     */
    public static async attachNetworkLogs(networkLogs: any[]): Promise<void> {
        try {
            const networkContent: string = JSON.stringify(networkLogs, null, 2);
            await AllureUtils.addAttachment('Network Requests', networkContent, 'application/json');
        } catch (error) {
            console.warn('Failed to attach network logs to Allure:', error);
        }
    }

    /**
     * Mark test as known issue
     * @param issueDescription - Description of the known issue
     */
    public static markAsKnownIssue(issueDescription: string): void {
        try {
            allure.tag('known-issue');
            allure.description(`Known Issue: ${issueDescription}`);
            console.log(`Test marked as known issue: ${issueDescription}`);
        } catch (error) {
            console.warn('Failed to mark test as known issue:', error);
        }
    }

    /**
     * Add test execution details
     * @param details - Execution details
     */
    public static addExecutionDetails(details: {
        startTime?: Date;
        endTime?: Date;
        duration?: number;
        retryCount?: number;
        browserName?: string;
        viewport?: { width: number; height: number };
    }): void {
        try {
            if (details.startTime) {
                AllureUtils.addParameter('Start Time', details.startTime.toISOString());
            }
            
            if (details.endTime) {
                AllureUtils.addParameter('End Time', details.endTime.toISOString());
            }
            
            if (details.duration) {
                AllureUtils.addParameter('Duration (ms)', details.duration.toString());
            }
            
            if (details.retryCount !== undefined) {
                AllureUtils.addParameter('Retry Count', details.retryCount.toString());
            }
            
            if (details.browserName) {
                AllureUtils.addParameter('Browser', details.browserName);
            }
            
            if (details.viewport) {
                AllureUtils.addParameter('Viewport', `${details.viewport.width}x${details.viewport.height}`);
            }
            
            console.log('Execution details added to Allure report');
        } catch (error) {
            console.warn('Failed to add execution details to Allure:', error);
        }
    }

    /**
     * Create test suite documentation
     * @param suiteName - Name of the test suite
     * @param description - Suite description
     * @param tests - Array of test information
     */
    public static createSuiteDocumentation(
        suiteName: string,
        description: string,
        tests: Array<{ name: string; description: string; tags: string[] }>
    ): void {
        try {
            const suiteInfo = {
                name: suiteName,
                description: description,
                tests: tests,
                createdAt: new Date().toISOString()
            };
            
            const suiteDocPath = path.join('allure-results', `suite-${suiteName.replace(/\s+/g, '-')}.json`);
            fs.writeFileSync(suiteDocPath, JSON.stringify(suiteInfo, null, 2));
            
            console.log(`📚 Suite documentation created: ${suiteName}`);
        } catch (error) {
            console.warn('Failed to create suite documentation:', error);
        }
    }
}