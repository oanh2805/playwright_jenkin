import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// ====== Background and Navigation Steps ======

Given('I am on the Levents homepage', async function (this: CustomWorld) {
    await this.navigateToApp();
    await this.homePage.verifyPageIsLoaded();
});

Given('I navigate to the login page', async function (this: CustomWorld) {
    await this.loginPage.navigateToLogin();
});

// ====== Input Steps ======

When('I enter valid phone number and password', async function (this: CustomWorld) {
    const credentials = this.getTestCredentials();
    await this.loginPage.enterPhoneNumber(credentials.phone);
    await this.loginPage.enterPassword(credentials.password);
});

When('I enter valid phone number', async function (this: CustomWorld) {
    const credentials = this.getTestCredentials();
    await this.loginPage.enterPhoneNumber(credentials.phone);
});

When('I enter valid password', async function (this: CustomWorld) {
    const credentials = this.getTestCredentials();
    await this.loginPage.enterPassword(credentials.password);
});

When('I enter invalid phone number {string}', async function (this: CustomWorld, invalidPhone: string) {
    await this.loginPage.enterPhoneNumber(invalidPhone);
});

When('I enter invalid password {string}', async function (this: CustomWorld, invalidPassword: string) {
    await this.loginPage.enterPassword(invalidPassword);
});

// ====== Action Steps ======

When('I click the login button', async function (this: CustomWorld) {
    await this.loginPage.clickLoginButton();
});

// ====== Verification Steps - Success Cases ======

Then('I should be successfully logged in', async function (this: CustomWorld) {
    await this.homePage.verifyLoginSuccess();
});

Then('I should see the homepage', async function (this: CustomWorld) {
    await this.homePage.verifyPageIsLoaded();
});

Then('I should see user profile menu', async function (this: CustomWorld) {
    const userMenuAvailable = await this.homePage.isUserMenuAvailable();
    expect(userMenuAvailable, 'User profile menu should be visible after successful login').toBeTruthy();
});

// ====== Verification Steps - Error Cases ======

Then('I should see an error message', async function (this: CustomWorld) {
    const errorMessage = await this.loginPage.getLoginErrorMessage();
    expect(errorMessage, 'Error message should be displayed for invalid login attempt').toBeTruthy();
    expect(errorMessage.length, 'Error message should not be empty').toBeGreaterThan(0);
});

Then('I should remain on the login page', async function (this: CustomWorld) {
    const currentUrl = this.getCurrentUrl();
    expect(
        currentUrl.includes('/login') || currentUrl.includes('signin'),
        `Expected to remain on login page. Current URL: ${currentUrl}`
    ).toBeTruthy();
});