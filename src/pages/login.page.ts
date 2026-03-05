import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { TestUtils } from '../utils/test.utils';

/**
 * Login Page Object Model
 * Handles all login-related interactions and validations
 */
export class LoginPage extends BasePage {
    // Fixed locators defined as static class variables 
    private static readonly INPUT_PHONE_NUMBER = "form[data-type='form_login'] input[name='phone_number']";
    private static readonly INPUT_PASSWORD = "form[data-type='form_login'] input[name='password']";
    private static readonly BUTTON_LOGIN = "form[data-type='form_login'] button[type='submit']:has-text('Đăng nhập')";
    private static readonly TEXT_ERROR_MESSAGE = "//div[contains(@class, 'error') or contains(@class, 'alert-error') or @data-testid='error']";
    private static readonly FORM_LOGIN_CONTAINER = "form[data-type='form_login']";
   
    /**
     * Constructor - Initialize page with Playwright page instance
     * @param page - Playwright page instance
     */
    constructor(page: Page) {
        super(page);
    }

    /**
     * Navigate to login page with verification
     * @param loginPath - Optional specific login path (default: '/login')
     */
    public async navigateToLogin(loginPath: string = '/login'): Promise<void> {
        try {
            // Giả định envUtils và navigateTo được kế thừa từ BasePage
            const baseUrl: string = this.envUtils.getBaseUrl();
            const loginUrl: string = `${baseUrl.replace(/\/$/, '')}${loginPath}`;

            await this.navigateTo(loginUrl);
            await this.verifyPageIsLoaded();
        } catch (error) {
            await this.captureScreenshot('navigate_to_login_error');
            throw new Error(
                `Failed to navigate to login page. ` +
                `Attempted URL: ${loginPath}. ` +
                `Error: ${error}`
            );
        }
    }

    /**
     * Enter phone number in the phone number field
     * @param phoneNumber - Phone number to enter
     */
    public async enterPhoneNumber(phoneNumber: string): Promise<void> {
        try {
            const phoneField = this.page.locator(LoginPage.INPUT_PHONE_NUMBER);
            await phoneField.waitFor({ state: 'visible', timeout: this.timeout });
            await phoneField.focus();
            await phoneField.fill(phoneNumber);

            // Verify the value was entered
            const actualValue = await phoneField.inputValue();
            if (actualValue !== phoneNumber) {
                throw new Error(`Input verification failed. Expected: "${phoneNumber}", Actual: "${actualValue}"`);
            }

            console.log(`Successfully entered phone number: ${phoneNumber.substring(0, 3)}***`);
        } catch (error) {
            await this.captureScreenshot('enter_phone_number_error');
            throw new Error(
                `Failed to enter phone number. ` +
                `Phone: ${phoneNumber.substring(0, 3)}***. ` +
                `Selector: ${LoginPage.INPUT_PHONE_NUMBER}. ` +
                `Error: ${error}`
            );
        }
    }

    /**
     * Enter password in the password field
     * @param password - Password to enter
     */
    public async enterPassword(password: string): Promise<void> {
        try {
            const passwordField = this.page.locator(LoginPage.INPUT_PASSWORD);
            await passwordField.waitFor({ state: 'visible', timeout: this.timeout });
            await passwordField.focus();
            await passwordField.fill(password);

            console.log(`Successfully entered password (hidden for security)`);
        } catch (error) {
            await this.captureScreenshot('enter_password_error');
            throw new Error(
                `Failed to enter password. ` +
                `Selector: ${LoginPage.INPUT_PASSWORD}. ` +
                `Error: ${error}`
            );
        }
    }

    /**
     * Click the login button
     */
    public async clickLoginButton(): Promise<void> {
        try {
            const loginButton = this.page.locator(LoginPage.BUTTON_LOGIN);
            await loginButton.waitFor({ state: 'visible', timeout: this.timeout });
            await loginButton.click();

            // Wait for page transition or loading
            await this.waitForLoadingComplete();
        } catch (error) {
            const button = this.page.locator(LoginPage.BUTTON_LOGIN);
            const isVisible = await button.isVisible().catch(() => false);
            const isEnabled = await button.isEnabled().catch(() => false);

            throw new Error(
                `Failed to click login button. ` +
                `Selector: ${LoginPage.BUTTON_LOGIN}. ` +
                `Button visible: ${isVisible}. ` +
                `Button enabled: ${isEnabled}. ` +
                `Error: ${error}`
            );
        }
    }

    /**
     * Perform complete login process with credentials 
     * (Used mainly by pure Playwright test runner)
     * @param phoneNumber - User phone number
     * @param password - User password
     */
    public async performLogin(phoneNumber: string, password: string): Promise<void> {
        try {
            await this.enterPhoneNumber(phoneNumber);
            await this.enterPassword(password);
            await this.clickLoginButton();
            console.log('Login form submitted successfully');
        } catch (error) {
            await this.captureScreenshot('login_process_error');
            throw new Error(
                `Login process failed for user ${phoneNumber.substring(0, 3)}***. ` +
                `Current URL: ${this.getCurrentUrl()}. ` +
                `Error: ${error}`
            );
        }
    }

    /**
     * Verify login page is loaded correctly
     * Implementation of abstract method from BasePage
     */
    public async verifyPageIsLoaded(): Promise<void> {
        try {
            await TestUtils.waitForElementVisible(this.page, LoginPage.FORM_LOGIN_CONTAINER, this.timeout, 'Login Form Container');
            await TestUtils.waitForElementVisible(this.page, LoginPage.INPUT_PHONE_NUMBER, this.timeout, 'Phone Number Input');
            await TestUtils.waitForElementVisible(this.page, LoginPage.INPUT_PASSWORD, this.timeout, 'Password Input');
            await TestUtils.waitForElementVisible(this.page, LoginPage.BUTTON_LOGIN, this.timeout, 'Login Button');

            // Verify page URL contains login
            await this.verifyUrl('login', 'Login page URL verification');

            console.log('Login page loaded and verified successfully');
        } catch (error) {
            await this.captureScreenshot('login_page_verification_error');
            throw new Error(
                `Login page verification failed. ` +
                `Current URL: ${this.getCurrentUrl()}. ` +
                `Page title: ${await this.page.title()}. ` +
                `Error: ${error}`
            );
        }
    }

    /**
     * Get current error message displayed on login form
     * @returns Error message text or empty string if no error
     */
    public async getLoginErrorMessage(): Promise<string> {
        try {
            const hasError: boolean = await this.page.locator(LoginPage.TEXT_ERROR_MESSAGE).isVisible();
            if (hasError) {
                return await this.getElementText(LoginPage.TEXT_ERROR_MESSAGE, 'Login Error Message');
            }
            return '';
        } catch {
            return '';
        }
    }
}