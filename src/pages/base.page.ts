import { Page, Locator, expect } from '@playwright/test';
import { TestUtils } from '../utils/test.utils';
import { EnvUtils } from '../utils/env.utils';

/**
 * Base Page class that serves as foundation for all page objects
 * Implements common page operations, error handling, and locator management
 */
export abstract class BasePage {
    protected readonly page: Page;
    protected readonly envUtils: EnvUtils;
    protected readonly timeout: number;

    // Common locators used across multiple pages
    protected readonly commonLoadingSpinner: string = '[data-testid="loading"], .loading, .spinner';
    protected readonly commonErrorMessage: string = '[data-testid="error"], .error-message, .alert-error';
    protected readonly commonSuccessMessage: string = '[data-testid="success"], .success-message, .alert-success';

    /**
     * Constructor for BasePage
     * @param page - Playwright page instance
     */
    constructor(page: Page) {
        this.page = page;
        this.envUtils = EnvUtils.getInstance();
        this.timeout = this.envUtils.getNumber('APP_TIMEOUT', 30000);
    }

    /**
     * Navigate to a specific URL with error handling and loading verification
     * @param url - URL to navigate to
     * @param waitForLoad - Whether to wait for page load completion
     */
    public async navigateTo(url: string, waitForLoad: boolean = true): Promise<void> {
        try {
            console.log(`Navigating to: ${url}`);
            await this.page.goto(url, { 
                waitUntil: 'domcontentloaded',
                timeout: this.timeout 
            });
            
            if (waitForLoad) {
                await TestUtils.waitForPageLoad(this.page, this.timeout);
            }
            
            console.log(`Successfully navigated to: ${url}`);
        } catch (error) {
            await TestUtils.captureScreenshot(this.page, 'navigation_error', 'navigate_to');
            throw new Error(
                `Failed to navigate to ${url}. ` +
                `Current URL: ${this.page.url()}. ` +
                `Error: ${error}`
            );
        }
    }

    public async scrollToElement(locator: Locator, elementDescription: string = 'element'): Promise<void> {
    try {
        await locator.scrollIntoViewIfNeeded();
        await TestUtils.wait(500);
    } catch (error) {
        console.log(`Could not scroll to ${elementDescription}: ${error}`);
    }
}

    /**
     * Click on element with enhanced error handling and retry mechanism
     * @param selector - Element selector
     * @param elementDescription - Human readable element description
     * @param options - Click options
     */

    public async clickElement(
        selector: string, 
        elementDescription: string,
        options: { timeout?: number; force?: boolean; retries?: number } = {}
    ): Promise<void> {
        const { timeout = this.timeout, force = false, retries = 0 } = options;
        
        await TestUtils.executeWithRetry(async () => {
            const element = this.page.locator(selector).first();
            await TestUtils.waitForElementVisible(this.page, selector, timeout, elementDescription);
            await this.scrollToElement(element, elementDescription);
            
            await element.click({ force, timeout });
        }, `Click ${elementDescription}`, retries);
    }


    /**
     * Fill input field with validation and error handling
     * @param selector - Input field selector
     * @param value - Value to fill
     * @param fieldDescription - Human readable field description
     * @param options - Fill options
     */

    public async fillInput(
        selector: string,
        value: string,
        fieldDescription: string,
        options: { timeout?: number; clear?: boolean; verify?: boolean } = {}
    ): Promise<void> {
        const { timeout = this.timeout, clear = true, verify = true } = options;
        const element = this.page.locator(selector); 

        try {
            // 1. Wait for element visible
            await TestUtils.waitForElementVisible(this.page, selector, timeout, fieldDescription);
            
            if (clear) {
                await element.clear();
            }
            
            await element.fill(value);
            
            // 4. Verify input just filled correctly 
            if (verify) {
                const actualValue: string = await element.inputValue();
                if (actualValue !== value) {
                    throw new Error(
                        `Failed to verify input value for ${fieldDescription}. ` +
                        `Expected: "${value}", Actual: "${actualValue}"`
                    );
                }
            }
            
            // Log sensitive data 
            console.log(`Successfully filled ${fieldDescription}: ${value.replace(/./g, '*')}***`);
            
        } catch (error) {
            // Capture screenshot if error is occured
            await TestUtils.captureScreenshot(this.page, 'fill_input_error', fieldDescription.replace(/\s+/g, '_'));
            throw new Error(
                `Failed to fill ${fieldDescription}. ` +
                `Selector: ${selector}. ` +
                `Value: ${value.substring(0, 3)}***. ` +
                `Error: ${error}`
            );
        }
    }



    /**
     * Wait for element to be visible with enhanced error context
     * @param selector - Element selector
     * @param elementDescription - Human readable element description
     * @param timeout - Timeout in milliseconds
     */
    public async waitForElement(
        selector: string,
        elementDescription: string,
        timeout: number = this.timeout
    ): Promise<void> {
        await TestUtils.waitForElementVisible(this.page, selector, timeout, elementDescription);
    }

    /**
     * Get element text with error handling
     * @param selector - Element selector
     * @param elementDescription - Human readable element description
     * @returns Element text content
     */
    public async getElementText(
        selector: string,
        elementDescription: string
    ): Promise<string> {
        try {
            await TestUtils.waitForElementVisible(this.page, selector, this.timeout, elementDescription);
            const text: string = await this.page.locator(selector).textContent() || '';
            console.log(`Retrieved text from ${elementDescription}: ${text.substring(0, 50)}...`);
            return text.trim();
        } catch (error) {
            await TestUtils.captureScreenshot(this.page, 'get_text_error', elementDescription.replace(/\s+/g, '_'));
            throw new Error(
                `Failed to get text from ${elementDescription}. ` +
                `Selector: ${selector}. ` +
                `Error: ${error}`
            );
        }
    }

    /**
     * Verify page title with enhanced error message
     * @param expectedTitle - Expected page title
     * @param exactMatch - Whether to perform exact match or partial match
     */
    public async verifyPageTitle(
        expectedTitle: string,
        exactMatch: boolean = false
    ): Promise<void> {
        try {
            const actualTitle: string = await this.page.title();
            
            if (exactMatch) {
                await TestUtils.assertWithScreenshot(
                    this.page,
                    actualTitle,
                    expectedTitle,
                    `Page title mismatch. Expected: "${expectedTitle}", Actual: "${actualTitle}". Current URL: ${this.page.url()}`
                );
            } else {
                expect(actualTitle, 
                    `Page title does not contain expected text. ` +
                    `Expected to contain: "${expectedTitle}", Actual: "${actualTitle}". ` +
                    `Current URL: ${this.page.url()}`
                ).toContain(expectedTitle);
            }
            
            console.log(`Page title verified: ${actualTitle}`);
        } catch (error) {
            await TestUtils.captureScreenshot(this.page, 'title_verification_error', 'page_title');
            throw error;
        }
    }

    /**
     * Verify current URL contains expected path or domain
     * @param expectedUrlPart - Expected URL part
     * @param errorContext - Additional context for error message
     */
    public async verifyUrl(
        expectedUrlPart: string,
        errorContext: string = 'URL verification'
    ): Promise<void> {
        try {
            const currentUrl: string = this.page.url();
            expect(currentUrl,
                ` ${errorContext} failed. ` +
                `Expected URL to contain: "${expectedUrlPart}", ` +
                `Actual URL: "${currentUrl}"`
            ).toContain(expectedUrlPart);
            
            console.log(`URL verification passed: ${currentUrl}`);
        } catch (error) {
            await TestUtils.captureScreenshot(this.page, 'url_verification_error', errorContext.replace(/\s+/g, '_'));
            throw error;
        }
    }

    /**
     * Wait for loading to complete
     * @param timeout - Timeout in milliseconds
     */
    public async waitForLoadingComplete(timeout: number = this.timeout): Promise<void> {
        try {
            // Wait for common loading indicators to disappear
            await this.page.locator(this.commonLoadingSpinner).waitFor({ 
                state: 'hidden', 
                timeout 
            });
        } catch {
            // Loading indicator might not be present, which is fine
        }
    }

    /**
     * Check if error message is displayed on page
     * @returns True if error message is visible
     */
    public async hasErrorMessage(): Promise<boolean> {
        try {
            return await this.page.locator(this.commonErrorMessage).isVisible();
        } catch {
            return false;
        }
    }

    /**
     * Get error message text if displayed
     * @returns Error message text or empty string
     */
    public async getErrorMessage(): Promise<string> {
        try {
            if (await this.hasErrorMessage()) {
                return await this.page.locator(this.commonErrorMessage).textContent() || '';
            }
            return '';
        } catch {
            return '';
        }
    }

    /**
     * Take screenshot with test context
     * @param stepName - Name of the step for screenshot
     * @returns Screenshot file path
     */
    public async captureScreenshot(stepName: string): Promise<string> {
        const testName: string = this.constructor.name.toLowerCase();
        return await TestUtils.captureScreenshot(this.page, testName, stepName);
    }

    /**
     * Abstract method for page-specific validation
     * Each page should implement this to verify page is loaded correctly
     */
    public abstract verifyPageIsLoaded(): Promise<void>;

    /**
     * Get page URL for reference
     * @returns Current page URL
     */
    public getCurrentUrl(): string {
        return this.page.url();
    }

    /**
     * Refresh the current page
     */
    public async refreshPage(): Promise<void> {
        try {
            console.log('Refreshing page...');
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            await TestUtils.waitForPageLoad(this.page, this.timeout);
            console.log('Page refreshed successfully');
        } catch (error) {
            await TestUtils.captureScreenshot(this.page, 'page_refresh_error', 'refresh');
            throw new Error(`Failed to refresh page: ${error}`);
        }
    }
}