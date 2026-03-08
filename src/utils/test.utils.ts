import { Page, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { EnvUtils } from './env.utils';

/**
 * Test utilities for common testing operations
 * Includes screenshot capture, error handling, and verification utilities
 */
export class TestUtils {
    private static envUtils: EnvUtils = EnvUtils.getInstance();

    /**
     * Capture screenshot with timestamp and test context
     * @param page - Playwright page instance
     * @param testName - Name of the test for screenshot naming
     * @param step - Optional step description
     * @returns Screenshot file path
     */
    public static async captureScreenshot(
        page: Page, 
        testName: string, 
        step: string = 'screenshot'
    ): Promise<string> {
        try {
            const timestamp: string = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotDir: string = this.envUtils.get('SCREENSHOT_DIR', 'screenshots');
            const fileName: string = `${testName}_${step}_${timestamp}.png`;
            const filePath: string = path.join(screenshotDir, fileName);
            
            // Ensure screenshot directory exists
            await this.ensureDirectoryExists(screenshotDir);
            
            await page.screenshot({ 
                path: filePath, 
                fullPage: false,      
                timeout: 10000,     
                animations: "disabled" 
            });

            return filePath;
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            // Fix: Không throw Error, chỉ return chuỗi rỗng để test không bị crash
            return '';
        }
    }

    /**
     * Enhanced assertion with custom error messages and screenshot capture
     * @param page - Playwright page instance
     * @param condition - Condition to assert
     * @param expectedValue - Expected value
     * @param errorMessage - Custom error message
     * @param captureScreenshotOnFailure - Whether to capture screenshot on failure
     */
    public static async assertWithScreenshot<T>(
        page: Page,
        condition: T,
        expectedValue: T,
        errorMessage: string,
        captureScreenshotOnFailure: boolean = true
    ): Promise<void> {
        try {
            expect(condition, errorMessage).toBe(expectedValue);
        } catch (error) {
            if (captureScreenshotOnFailure) {
                await this.captureScreenshot(page, 'assertion_failure', 'error');
            }
            console.error(`Assertion failed: ${errorMessage}`);
            console.error(`Expected: ${expectedValue}, Actual: ${condition}`);
            throw error;
        }
    }

    /**
     * Wait for element to be visible with enhanced error handling
     * @param page - Playwright page instance
     * @param selector - Element selector
     * @param timeout - Timeout in milliseconds
     * @param errorContext - Context information for error messages
     */
    public static async waitForElementVisible(
        page: Page,
        selector: string,
        timeout: number = 30000,
        errorContext: string = 'element'
    ): Promise<void> {
        try {
            await page.locator(selector).waitFor({ 
                state: 'visible', 
                timeout 
            });
            // Removed verbose log to reduce console noise
        } catch (error) {
            await this.captureScreenshot(page, 'element_not_visible', errorContext);
            const detectedElements: number = await page.locator(selector).count();
            throw new Error(
                `Element '${errorContext}' not visible within ${timeout}ms. ` +
                `Selector: ${selector}. Elements found: ${detectedElements}. ` +
                `Current URL: ${page.url()}. Original error: ${error}`
            );
        }
    }

    /**
     * Wait for page to load completely with loading indicators check
     * @param page - Playwright page instance
     * @param timeout - Timeout in milliseconds
     */
    public static async waitForPageLoad(
        page: Page, 
        timeout: number = 30000
    ): Promise<void> {
        try {
            // Wait for DOM content loaded first (required)
            await page.waitForLoadState('domcontentloaded', { timeout });

            // Try to wait for network idle with a shorter timeout to avoid hanging on external resources
            try {
                await page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 10000) });
            } catch {
                // If networkidle times out, continue anyway - external resources might be slow
            }

            // Wait for common loading indicators to disappear
            const loadingSelectors: string[] = [
                '[data-testid="loading"]',
                '.loading',
                '.spinner',
                '[class*="loading"]'
            ];

            for (const selector of loadingSelectors) {
                try {
                    await page.locator(selector).waitFor({ 
                        state: 'hidden', 
                        timeout: 5000 
                    });
                } catch {
                    // Ignore if loading indicator not found
                }
            }

            // console.log(`Page loaded successfully: ${page.url()}`);
        } catch (error) {
            await this.captureScreenshot(page, 'page_load_timeout', 'loading_error');
            throw new Error(
                `Page failed to load within ${timeout}ms. ` +
                `URL: ${page.url()}. Error: ${error}`
            );
        }
    }

    /**
     * Execute action with retry mechanism and error handling
     * @param action - Action to execute
     * @param actionName - Name of the action for logging
     * @param maxRetries - Maximum number of retries
     * @param retryDelay - Delay between retries in milliseconds
     */
    public static async executeWithRetry<T>(
        action: () => Promise<T>,
        actionName: string,
        maxRetries: number = 3,
        retryDelay: number = 1000
    ): Promise<T> {
        let lastError: Error | null = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Executing ${actionName} (attempt ${attempt}/${maxRetries})`);
                const result: T = await action();
                // console.log(`${actionName} completed successfully`);
                return result;
            } catch (error) {
                lastError = error as Error;
                console.warn(`${actionName} failed on attempt ${attempt}: ${error}`);
                
                if (attempt < maxRetries) {
                    console.log(`Retrying in ${retryDelay}ms...`);
                    await this.wait(retryDelay);
                }
            }
        }
        
        throw new Error(
            ` ${actionName} failed after ${maxRetries} attempts. ` +
            `Last error: ${lastError?.message}`
        );
    }

    /**
     * Wait for specified duration
     * @param milliseconds - Duration to wait
     */
    public static async wait(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    /**
     * Ensure directory exists, create if it doesn't
     * @param dirPath - Directory path
     */
    private static async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        } catch (error) {
            throw new Error(`Failed to create directory ${dirPath}: ${error}`);
        }
    }

    /**
     * Generate unique test identifier
     * @param prefix - Optional prefix for the identifier
     * @returns Unique identifier string
     */
    public static generateTestId(prefix: string = 'test'): string {
        const timestamp: string = Date.now().toString();
        const random: string = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}_${random}`;
    }

    /**
     * Clean up test artifacts (screenshots, videos, etc.)
     * @param keepLatest - Number of latest files to keep
     */
    public static async cleanupTestArtifacts(keepLatest: number = 5): Promise<void> {
        try {
            const screenshotDir: string = this.envUtils.get('SCREENSHOT_DIR', 'screenshots');
            
            if (fs.existsSync(screenshotDir)) {
                const files: string[] = fs.readdirSync(screenshotDir)
                    .filter(file => file.endsWith('.png'))
                    .sort((a, b) => {
                        const statA = fs.statSync(path.join(screenshotDir, a));
                        const statB = fs.statSync(path.join(screenshotDir, b));
                        return statB.mtime.getTime() - statA.mtime.getTime();
                    });

                // Remove old files, keep only the latest ones
                for (let i = keepLatest; i < files.length; i++) {
                    fs.unlinkSync(path.join(screenshotDir, files[i]));
                }

                console.log(`🧹 Cleaned up old test artifacts, kept ${keepLatest} latest files`);
            }
        } catch (error) {
            console.warn(`Failed to cleanup test artifacts: ${error}`);
        }
    }
}