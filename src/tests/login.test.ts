import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { HomePage } from '../pages/home.page';
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
 * Login Test Suite
 * Comprehensive test coverage for user authentication functionality
 * Uses Page Object Model pattern with Allure reporting integration
 */

test.describe('Login Functionality', () => {
    let loginPage: LoginPage;
    let homePage: HomePage;

    test.beforeEach(async ({ baseTest }) => {
        // Initialize page objects
        loginPage = new LoginPage(baseTest['page']);
        homePage = new HomePage(baseTest['page']);
        
        // Add test metadata for Allure
        AllureUtils.addTestMetadata({
            feature: 'Authentication',
            story: 'User Login',
            severity: 'critical',
            owner: 'QA Team',
            tags: ['smoke', 'login', 'critical']
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

    test('Successful login with valid credentials @smoke @login @critical', async ({ baseTest }) => {
        await AllureUtils.step('Navigate to login page', async () => {
            await homePage.navigateToLoginFromHeader();
            await AllureUtils.attachScreenshot(baseTest['page'], 'login_page_loaded', 'Login page loaded');
        }, baseTest['page']);

        await AllureUtils.step('Enter valid credentials', async () => {
            const credentials = baseTest.getTestCredentials();
            
            // Add credentials as parameters (mask sensitive data)
            AllureUtils.addParameter('Phone Number', credentials.phone.substring(0, 3) + '***');
            AllureUtils.addParameter('Password', '***');
            
            await loginPage.performLogin(credentials.phone, credentials.password);
            await AllureUtils.attachScreenshot(baseTest['page'], 'credentials_entered', 'Credentials entered');
        }, baseTest['page']);

        await AllureUtils.step('Verify successful login', async () => {
            await homePage.verifyLoginSuccess();
            await AllureUtils.attachScreenshot(baseTest['page'], 'login_successful', 'Login successful - Redirected back to Levents');
        }, baseTest['page']);
    });

    test('Login failed with invalid credentials should stay on login page @login @negative', async ({ baseTest }) => {
        await AllureUtils.step('Navigate to login page', async () => {
            await homePage.navigateToLoginFromHeader();
            await AllureUtils.attachScreenshot(baseTest['page'], 'invalid_login_page_loaded', 'Login page loaded for invalid credential test');
        }, baseTest['page']);

        await AllureUtils.step('Enter invalid credentials', async () => {
            const credentials = baseTest.getTestCredentials();
            const invalidPhone = `${credentials.phone}999`;
            const invalidPassword = `${credentials.password}invalid`;

            AllureUtils.addParameter('Invalid Phone Number', invalidPhone.substring(0, 3) + '***');
            AllureUtils.addParameter('Invalid Password', '***');

            await loginPage.performLogin(invalidPhone, invalidPassword);
            await AllureUtils.attachScreenshot(baseTest['page'], 'invalid_credentials_entered', 'Invalid credentials entered');
        }, baseTest['page']);

        await AllureUtils.step('Verify login is blocked', async () => {
            await baseTest['page'].waitForTimeout(1500);
            const currentUrl = baseTest['page'].url();

            expect(
                currentUrl.includes('/login') || currentUrl.includes('signin'),
                `Expected to remain on login page for invalid credential. Current URL: ${currentUrl}`
            ).toBeTruthy();

            await AllureUtils.attachScreenshot(baseTest['page'], 'invalid_login_blocked', 'Invalid login blocked - still on login page');
        }, baseTest['page']);
    });
});