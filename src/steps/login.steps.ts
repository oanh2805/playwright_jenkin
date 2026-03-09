import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

// ====== Background Step ======

Given('I am on the Levents homepage', async function (this: any) {
    await this.page.goto(process.env.BASE_URL);
    await this.homePage.verifyPageIsLoaded();
});

// ====== Action Steps ======

When('I navigate to the login page from homepage', async function (this: any) {
    await this.homePage.navigateToLoginFromHeader();
});

When('I enter valid phone number and password', async function (this: any) {
    const phone = process.env.TEST_PHONE || '';
    const password = process.env.TEST_PASSWORD || '';

    if (!phone || !password) {
        throw new Error('TEST_PHONE or TEST_PASSWORD environment variables are not set');
    }

    await this.loginPage.performLogin(phone, password);
});

When('I enter invalid credentials', async function (this: any) {
    const phone = (process.env.TEST_PHONE || '') + '999';
    const password = (process.env.TEST_PASSWORD || '') + 'invalid';

    await this.loginPage.performLogin(phone, password);
});

// ====== Verification Steps ======

Then('I should be successfully logged in', async function (this: any) {
    await this.homePage.verifyLoginSuccess();
});

Then('I should remain on the login page', async function (this: any) {
    await this.page.waitForTimeout(1500);
    const currentUrl = this.page.url();

    // Assert URL vẫn đang chứa chữ login/signin
    expect(
        currentUrl.includes('/login') || currentUrl.includes('signin'),
        `Expected to remain on login page for invalid credential. Current URL: ${currentUrl}`
    ).toBeTruthy();
});