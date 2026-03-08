import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// ====== Background Step ======

Given('I am on the Levents homepage', async function (this: CustomWorld) {
    await this.navigateToApp();
    await this.homePage.verifyPageIsLoaded();
});

// ====== Action Steps ======

When('I navigate to the login page from homepage', async function (this: CustomWorld) {
    await this.homePage.navigateToLoginFromHeader();
});

When('I enter valid phone number and password', async function (this: CustomWorld) {
    const credentials = this.getTestCredentials();
    // Hàm performLogin bao gồm điền sđt, điền pass và click nút đăng nhập
    await this.loginPage.performLogin(credentials.phone, credentials.password);
});

When('I enter invalid credentials', async function (this: CustomWorld) {
    const credentials = this.getTestCredentials();
    // Cố tình sai sđt và mật khẩu
    const invalidPhone = `${credentials.phone}999`;
    const invalidPassword = `${credentials.password}invalid`;
    
    await this.loginPage.performLogin(invalidPhone, invalidPassword);
});

// ====== Verification Steps ======

Then('I should be successfully logged in', async function (this: CustomWorld) {
    await this.homePage.verifyLoginSuccess();
});

Then('I should remain on the login page', async function (this: CustomWorld) {
    await this.page.waitForTimeout(1500);
    const currentUrl = this.getCurrentUrl();

    // Assert URL vẫn đang chứa chữ login/signin
    expect(
        currentUrl.includes('/login') || currentUrl.includes('signin'),
        `Expected to remain on login page for invalid credential. Current URL: ${currentUrl}`
    ).toBeTruthy();
});