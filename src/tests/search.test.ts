import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '../pages/home.page';
import { ProductPage } from '../pages/product.page';
import { AllureUtils } from '../utils/allure.utils';
import { BaseTest } from '../utils/base-test.util';
 
// Extend base test with our custom fixtures
const test = base.extend<{
    baseTest: BaseTest;
}>({
    baseTest: async ({ page, context }, use, testInfo) => {
        const baseTest = new BaseTest(page, context, testInfo);
        await baseTest.setup();
       
        try {
            await use(baseTest);
        } finally {
            await baseTest.teardown();
        }
    }
});
 
/**
 * Search Functionality Test Suite
 * Test suite for search functionality after user login
 */
 
test.describe('Search Functionality', () => {
    let loginPage: LoginPage;
    let homePage: HomePage;
    let productPage: ProductPage;
 
    test.beforeEach(async ({ baseTest }) => {
        // Initialize page objects
        loginPage = new LoginPage(baseTest['page']);
        homePage = new HomePage(baseTest['page']);
        productPage = new ProductPage(baseTest['page']);
       
        // Add test metadata for Allure
        AllureUtils.addTestMetadata({
            feature: 'Search',
            story: 'Product Search',
            severity: 'normal',
            owner: 'QA Team',
            tags: ['search', 'ecommerce', 'functionality']
        });
       
        // Add environment information
        const browserConfig = baseTest.getBrowserConfig();
        AllureUtils.addEnvironmentInfo({
            browser: browserConfig.browser,
            baseUrl: baseTest.envUtils.getBaseUrl(),
            environment: process.env.ENV || 'default',
            testType: 'E2E'
        });
    });
 
    test('Search for product and select first result @smoke @search @ecommerce', async ({ baseTest }) => {
        // Login
        await AllureUtils.step('Login with valid credentials', async () => {
            await homePage.navigateToLoginFromHeader();
           
            // Browser-specific wait for stability
            const browserName = baseTest['page'].context().browser()?.browserType().name();
            const waitTime = browserName === 'webkit' ? 3000 : browserName === 'firefox' ? 2000 : 1000;
            await baseTest['page'].waitForTimeout(waitTime);
           
            const credentials = baseTest.getTestCredentials();
            await loginPage.performLogin(credentials.phone, credentials.password);
           
            // Wait for navigation
            await baseTest['page'].waitForTimeout(2000);
            await homePage.verifyLoginSuccess();
        }, baseTest['page']);
 
        // Search for product
        await AllureUtils.step('Search for product', async () => {
            // Click search wrapper
            const searchWrapper = baseTest['page'].locator('div.input-search--wrapper:visible').first();
            await searchWrapper.click();
            await baseTest['page'].waitForTimeout(1000);
           
            // Enter search keyword
            const searchKeyword = 'hoodie boxy';
            const searchInput = baseTest['page'].locator('input:visible').first();
           
            try {
                await searchInput.fill(searchKeyword);
            } catch (error) {
                // Fallback: keyboard typing
                await baseTest['page'].keyboard.type(searchKeyword);
            }
           
            // Trigger search
            await baseTest['page'].keyboard.press('Enter');
            await baseTest['page'].waitForTimeout(3000);
           
            AllureUtils.addParameter('Search Keyword', searchKeyword);
        }, baseTest['page']);
 
        // Select first result
        await AllureUtils.step('Select first search result', async () => {
            const resultSelectors = [
                'a[href*="/products/"]:has-text("hoodie"):visible',
                'a[href*="/products/"]:has-text("boxy"):visible',
                'a[href*="/products/"]:not(:has(img)):visible',
                '.search-result a:visible',
                '[class*="product"] a:visible'
            ];
           
            let productSelected = false;
           
            for (const selector of resultSelectors) {
                try {
                    const productLink = baseTest['page'].locator(selector).first();
                    if (await productLink.isVisible()) {
                        await productLink.click();
                        await baseTest['page'].waitForTimeout(2000);
                       
                        if (baseTest['page'].url().includes('/products/')) {
                            const productName = await productLink.textContent() || 'Product';
                            console.log(`Selected product: ${productName.trim()}`);
                            AllureUtils.addParameter('Selected Product', productName.trim());
                            productSelected = true;
                            break;
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
           
            if (!productSelected) {
                throw new Error('Could not select any search result');
            }
        }, baseTest['page']);
 
        // Verify product page
        await AllureUtils.step('Verify product page loaded', async () => {
            await productPage.verifyPageIsLoaded();
            const productTitle = await productPage.getProductTitle();
           
            console.log(`Product page loaded: ${productTitle}`);
            AllureUtils.addParameter('Product Title', productTitle);
        }, baseTest['page']);
    });
});