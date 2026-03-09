import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { TestUtils } from '../utils/test.utils';

/**
 * Home Page Object Model
 * Handles navigation to login and login success verifications
 */
export class HomePage extends BasePage {
    // Fixed locators defined directly
    private readonly button_UserProfile = "a:has-text('Tài khoản'), a[href*='profile'], a[href*='account'], button:has-text('Tài khoản')";
    private readonly button_UserMenu = "a:has-text('Tài khoản'), a[href*='profile'], a[href*='account'], button:has-text('Tài khoản'), [class*='user']";
    private readonly navigation_MainMenu = "li.menu-item:visible, nav:visible, ul[class*='menu']:visible, [role='navigation']:visible, .categories-list:visible";
    private readonly container_PageContent = "main:visible, #main:visible, .main:visible, #content:visible, .content:visible, #container:visible, .container:visible, body:visible";
    private readonly link_HeaderLogin = "a[href='/login']:visible, a.x-loginbar-customer:visible, a:has-text('Login'):visible, a:has-text('Đăng nhập'):visible";

    constructor(page: Page) {
        super(page);
    }

    public async navigateToLoginFromHeader(): Promise<void> {
        try {
            const homeUrl: string = this.envUtils.getBaseUrl();
            await this.page.goto(homeUrl, {
                waitUntil: 'domcontentloaded',
                timeout: this.timeout
            });

            await TestUtils.waitForElementVisible(this.page, this.link_HeaderLogin, this.timeout, 'Header Account/Login Link');

            const loginLink = this.page.locator(this.link_HeaderLogin).first();

            await loginLink.scrollIntoViewIfNeeded();

            await this.page.waitForTimeout(500);
            await loginLink.click({ force: true });

            await this.page.waitForURL('**/login**', {
                timeout: this.timeout,
                waitUntil: 'commit'
            });

        } catch (error) {
            await this.captureScreenshot('navigate_to_login_from_header_error');
            throw new Error(`Failed to navigate to login. URL: ${this.getCurrentUrl()}. Error: ${error}`);
        }
    }


    public async openUserMenu(): Promise<void> {
        try {
            const userMenuVisible = await this.page.locator(this.button_UserMenu).isVisible();
            const userProfileVisible = await this.page.locator(this.button_UserProfile).isVisible();

            if (userMenuVisible) {
                await this.clickElement(this.button_UserMenu, 'User Menu Button');
            } else if (userProfileVisible) {
                await this.clickElement(this.button_UserProfile, 'User Profile Button');
            } else {
                throw new Error('No user menu or profile button found');
            }
            await TestUtils.wait(1000);
        } catch (error) {
            await this.captureScreenshot('home_open_user_menu_error');
            throw new Error(`Home Page - Open user menu failed. URL: ${this.getCurrentUrl()}. Error: ${error}`);
        }
    }

    public async verifyPageIsLoaded(): Promise<void> {
        try {
            // Wait for body and login link as these are the most reliable indicators
            await this.page.locator('body').waitFor({ state: 'visible', timeout: this.timeout });
            await this.page.locator(this.link_HeaderLogin).first().waitFor({ state: 'visible', timeout: this.timeout });

            const currentUrl: string = this.getCurrentUrl();
            if (currentUrl.includes('login') || currentUrl.includes('signin')) {
                throw new Error(`Still on login page. URL: ${currentUrl}`);
            }
            if (currentUrl.includes('error') || currentUrl.includes('404')) {
                throw new Error(`On error page. URL: ${currentUrl}`);
            }
        } catch (error) {
            await this.captureScreenshot('home_page_verification_error');
            throw new Error(`Home page verification failed. URL: ${this.getCurrentUrl()}. Error: ${error}`);
        }
    }

    public async verifyLoginSuccess(): Promise<void> {
        try {
            const baseUrl = this.envUtils.getBaseUrl();
            const expectedDomain = baseUrl.replace(/https?:\/\//, '').replace(/\/$/, '');

            await this.page.waitForLoadState('load', { timeout: Math.min(this.timeout, 10000) }).catch(() => { });
            await this.page.evaluate(() => {
                document.documentElement.style.scrollBehavior = 'auto';
                document.body.style.scrollBehavior = 'auto';
                window.scrollTo(0, 0);
            }).catch(() => { });

            const start = Date.now();
            let lastUrl = this.getCurrentUrl();
            let lastErrorMessage = '';

            while (Date.now() - start < this.timeout) {
                if (await this.hasErrorMessage()) {
                    lastErrorMessage = await this.getErrorMessage();
                    break;
                }
                if (await this.isUserMenuAvailable()) return;

                lastUrl = this.getCurrentUrl();
                if (!lastUrl.includes('login') && !lastUrl.includes('signin') && lastUrl.includes(expectedDomain)) {
                    return;
                }
                await TestUtils.wait(500);
            }

            if (lastErrorMessage) {
                throw new Error(`Still on login page. URL: ${lastUrl}. Error: ${lastErrorMessage}`);
            }
            throw new Error(`Login success not detected. URL: ${lastUrl}. Expected domain: ${expectedDomain}`);
        } catch (error) {
            await this.captureScreenshot('login_success_verification_failed');
            throw new Error(`Home Page - Verify login success failed. URL: ${this.getCurrentUrl()}. Error: ${error}`);
        }
    }

    public async isUserMenuAvailable(): Promise<boolean> {
        try {
            return await this.page.locator(this.button_UserMenu).isVisible() ||
                await this.page.locator(this.button_UserProfile).isVisible();
        } catch {
            return false;
        }
    }
}