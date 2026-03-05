import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '../pages/home.page';
import { ProductPage } from '../pages/product.page';
import { CartPage } from '../pages/cart.page';
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
 * Shopping Cart Test Suite
 * Test suite for e-commerce cart functionality after user login
 * Focuses on product selection and cart operations
 */
 
test.describe('Shopping Cart Functionality', () => {
    let loginPage: LoginPage;
    let homePage: HomePage;
    let productPage: ProductPage;
    let cartPage: CartPage;
 
    test.beforeEach(async ({ baseTest }) => {
        // Initialize page objects
        loginPage = new LoginPage(baseTest['page']);
        homePage = new HomePage(baseTest['page']);
        productPage = new ProductPage(baseTest['page']);
        cartPage = new CartPage(baseTest['page']);
       
        // Add test metadata for Allure
        AllureUtils.addTestMetadata({
            feature: 'E-Commerce',
            story: 'Shopping Cart',
            severity: 'critical',
            owner: 'QA Team',
            tags: ['cart', 'ecommerce', 'integration']
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
 
    test('Add product to cart after successful login @smoke @cart @ecommerce', async ({ baseTest }) => {
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
 
        // Select product and add to cart
        await AllureUtils.step('Select product and add to cart', async () => {
            let productInfo: { name: string; price: string };
           
            try {
                productInfo = await productPage.selectProductFromHomePage();
            } catch (error) {
                productInfo = await productPage.navigateToProductDirect();
            }
           
            await productPage.addToCart();
            AllureUtils.addParameter('Product Name', productInfo.name);
        }, baseTest['page']);
 
        // Verify cart
        await AllureUtils.step('Verify product is in cart', async () => {
            await cartPage.navigateToCart();
            await cartPage.verifyPageIsLoaded();
           
            const cartItemsCount = await cartPage.getCartItemsCount();
            console.log(` Cart items: ${cartItemsCount}`);
           
            AllureUtils.addParameter('Cart Items Count', cartItemsCount.toString());
        }, baseTest['page']);
    });
});