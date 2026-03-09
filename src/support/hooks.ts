import { Before, After, BeforeAll, AfterAll, Status, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, firefox, webkit, Browser, BrowserContext, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '../pages/home.page';
import { ProductPage } from '../pages/product.page';
import { CartPage } from '../pages/cart.page';

// Load environment variables based on ENV variable (default to qa)
const env = (process.env.ENV || 'qa').toLowerCase();
dotenv.config({ path: path.resolve(process.cwd(), `${env}.env`) });
dotenv.config({ path: path.resolve(process.cwd(), `.env`), override: false });

// Default timeout for each step: 60 seconds
setDefaultTimeout(60000);

let browser: Browser;

/**
 * Resolve the Playwright browser launcher based on the BROWSER env var.
 */
function getBrowserLauncher() {
    const browserName = (process.env.BROWSER || 'firefox').toLowerCase();
    switch (browserName) {
        case 'firefox':
            return firefox;
        case 'webkit':
        case 'safari':
            return webkit;
        case 'chrome':
        case 'chromium':
        case 'google-chrome':
            return chromium;
        default:
            return chromium;
    }
}

/**
 * Launch browser before running all scenarios.
 */
BeforeAll(async function () {
    const headed = process.env.HEADED === 'true';
    const launcher = getBrowserLauncher();

    browser = await launcher.launch({
        headless: !headed,
        slowMo: headed ? 500 : 0,
    });
});

/**
 * Close browser after all tests finish.
 */
AfterAll(async function () {
    if (browser) await browser.close();
});

/**
 * Before each scenario:
 * 1. Create a new Context and Page.
 * 2. Initialize Page Objects and attach to World (this).
 */
Before(async function (this: any) {
    this.context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
    });
    this.page = await this.context.newPage();

    // Initialize Page Objects
    this.loginPage = new LoginPage(this.page);
    this.homePage = new HomePage(this.page);
    this.productPage = new ProductPage(this.page);
    this.cartPage = new CartPage(this.page);
});

/**
 * After each scenario:
 * 1. Take screenshot on failure and attach to report.
 * 2. Close page and context.
 */
After(async function (this: any, { result }) {
    if (result?.status === Status.FAILED) {
        const image = await this.page.screenshot();
        if (image) {
            await this.attach(image, 'image/png');
        }
    }

    await this.page.close();
    await this.context.close();
});