import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

// ====== Background Step ======

Given('I am logged in to the application', async function (this: CustomWorld) {
    // 1. Navigate to login page
    await this.homePage.navigateToLoginFromHeader();
    
    // Đợi một chút cho trang ổn định (giống logic trong cart.test.ts)
    await this.page.waitForTimeout(2000);
    
    // 2. Perform login
    const credentials = this.getTestCredentials();
    await this.loginPage.performLogin(credentials.phone, credentials.password);
    
    // 3. Verify success
    await this.homePage.verifyLoginSuccess();
});

// ====== Action Steps ======

When('I select a product from the home page', async function (this: CustomWorld) {
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

When('I add the product to the cart', async function (this: CustomWorld) {
    const isAdded = await this.productPage.addToCart();
    // Verify hàm addToCart trả về true (nhấn nút thành công)
    expect(isAdded, 'Failed to add product to cart').toBeTruthy();
});

// ====== Verification Steps ======

Then('I should be able to navigate to the shopping cart', async function (this: CustomWorld) {
    await this.cartPage.navigateToCart();
    await this.cartPage.verifyPageIsLoaded();
});

Then('the cart items count should be greater than zero', async function (this: CustomWorld) {
    const cartItemsCount = await this.cartPage.getCartItemsCount();
    console.log(`Cart items count: ${cartItemsCount}`);
    
    // Khẳng định (Assert) số lượng trong giỏ hàng phải > 0
    expect(
        cartItemsCount, 
        'Cart should contain at least 1 item after adding a product'
    ).toBeGreaterThan(0);
});