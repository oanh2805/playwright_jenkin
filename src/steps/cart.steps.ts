import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

// ====== Background Step ======

Given('I am logged in to the application', async function (this: any) {
    await this.page.goto(process.env.BASE_URL);

    // 1. Navigate to login page
    await this.homePage.navigateToLoginFromHeader();

    await this.page.waitForTimeout(2000);

    // 2. Perform login
    const phone = process.env.TEST_PHONE || '';
    const password = process.env.TEST_PASSWORD || '';

    if (!phone || !password) {
        throw new Error('TEST_PHONE or TEST_PASSWORD environment variables are not set');
    }

    await this.loginPage.performLogin(phone, password);

    // 3. Verify success
    await this.homePage.verifyLoginSuccess();
});

// ====== Action Steps ======

When('I select a product from the home page', async function (this: any) {
    let productInfo: { name: string; price: string };

    try {
        // Thử chọn sản phẩm từ trang chủ trước
        productInfo = await this.productPage.selectProductFromHomePage();
        console.log(`Selected product: ${productInfo.name}`);
    } catch (error) {
        // Fallback: Nếu không click được thì bay thẳng vào link sản phẩm
        console.log('Falling back to direct product navigation...');
        productInfo = await this.productPage.navigateToProductDirect();
        console.log(`Directly navigated to product: ${productInfo.name}`);
    }
});

When('I add the product to the cart', async function (this: any) {
    const isAdded = await this.productPage.addToCart();
    // Verify hàm addToCart trả về true (nhấn nút thành công)
    expect(isAdded, 'Failed to add product to cart').toBeTruthy();
});

// ====== Verification Steps ======

Then('I should be able to navigate to the shopping cart', async function (this: any) {
    await this.cartPage.navigateToCart();
    await this.cartPage.verifyPageIsLoaded();
});

Then('the cart items count should be greater than zero', async function (this: any) {
    const cartItemsCount = await this.cartPage.getCartItemsCount();
    console.log(`Cart items count: ${cartItemsCount}`);

    // Assert số lượng trong giỏ hàng phải > 0
    expect(
        cartItemsCount,
        'Cart should contain at least 1 item after adding a product'
    ).toBeGreaterThan(0);
});
