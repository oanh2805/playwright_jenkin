import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { TestUtils } from '../utils/test.utils';

export class CartPage extends BasePage {
    private readonly container_CartItems = '//*[contains(@class, "cart-item")] | //*[contains(@class, "product")]';
    private readonly LOCATOR_CART_ICON = 'a[href*="/cart"]';
    private readonly LOCATOR_CART_CONTENT = '.cart-content';

    constructor(page: Page) {
        super(page);
    }

    public async navigateToCart(): Promise<void> {
        try {
            await TestUtils.wait(1000);
            const cartElement = this.page.locator(this.LOCATOR_CART_ICON).first();
            
            // Nếu thấy icon giỏ hàng thì click
            if (await cartElement.isVisible()) {
                await this.scrollToElement(cartElement, `Cart icon`);
                await cartElement.click({ force: true, timeout: 5000 });
                await TestUtils.wait(3000);
            } else {
                // Nếu không thấy thì điều hướng thẳng URL
                const baseUrl = this.envUtils.getBaseUrl();
                await this.navigateTo(`${baseUrl}/cart`);
                await TestUtils.wait(3000);
            }
        } catch (error) {
            await this.captureScreenshot('navigate_to_cart_error');
            throw new Error(`Cart Page - Navigate to cart failed. URL: ${this.getCurrentUrl()}. Error: ${error}`);
        }
    }

    private async isCartContentVisible(): Promise<boolean> {
        try {
            return await this.page.locator(this.LOCATOR_CART_CONTENT).first().isVisible();
        } catch {
            return false;
        }
    }

    public async getCartItemsCount(): Promise<number> {
        try {
            return await this.page.locator(this.container_CartItems).count();
        } catch {
            return 0;
        }
    }

    public async verifyPageIsLoaded(): Promise<void> {
        try {
            const currentUrl = this.getCurrentUrl();
            if (currentUrl.includes('/cart') || currentUrl.includes('gio-hang')) return;
            if (await this.isCartContentVisible()) return;
            
            throw new Error(`Not clearly on cart page. URL: ${currentUrl}`);
        } catch (error) {
            await this.captureScreenshot('verify_cart_page_loaded_error');
            throw new Error(`Cart Page - Verify page is loaded failed. Error: ${error}`);
        }
    }
}