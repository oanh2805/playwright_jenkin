import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { TestUtils } from '../utils/test.utils';

export class ProductPage extends BasePage {
    private readonly BTN_ADD_TO_CART_TEXT = 'Thêm vào giỏ';
    private readonly RELATIVE_PRICE_LOCATOR = '//*[contains(text(), "VND") or contains(text(), ".000")]';
    private readonly LOCATOR_PRICE = '[class*="price"]:visible';
    private readonly LOCATOR_PRODUCT_LINK = 'a[href*="/products/"]:has-text("Levents"):not(:has(img)) >> visible=true';
    private readonly LOCATOR_SUCCESS_MSG = 'text=Thêm thành công';
    private readonly DEFAULT_PRODUCT_PATH = '/products/levents-rhinestone-long-sleeve-boxy-tee';

    constructor(page: Page) {
        super(page);
    }

    public async selectProductFromHomePage(): Promise<{ name: string; price: string }> {
        let productName = '';
        let productPrice = '';

        try {
            const productLinks = await this.page.locator(this.LOCATOR_PRODUCT_LINK).all();
            
            if (productLinks.length === 0) {
                throw new Error('No product links found on home page');
            }

            // Lấy sản phẩm đầu tiên hợp lệ
            const productLink = productLinks[0];
            
            if (await productLink.isVisible() && await productLink.isEnabled()) {
                productName = await productLink.textContent() || '';
                
                try {
                    const parentElement = productLink.locator('xpath=./../..');
                    const priceElement = parentElement.locator(this.RELATIVE_PRICE_LOCATOR).first();
                    if (await priceElement.isVisible()) {
                        productPrice = await priceElement.textContent() || '';
                    }
                } catch (e) {
                    productPrice = 'Price loading...';
                }
                
                await this.scrollToElement(productLink, `Product: ${productName.trim()}`);
                await productLink.click({ force: true, timeout: 10000 });
                await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
                
                if (!this.getCurrentUrl().includes('/products/')) {
                    throw new Error('Click did not navigate to product page');
                }
            }
            
            return { name: productName, price: productPrice };
            
        } catch (error) {
            await this.captureScreenshot('select_product_from_home_page_error');
            throw new Error(`Product Page - Select product failed. URL: ${this.getCurrentUrl()}. Error: ${error}`);
        }
    }

    public async navigateToProductDirect(productPath?: string): Promise<{ name: string; price: string }> {
        const path = productPath || this.DEFAULT_PRODUCT_PATH;
        let productName = '';
        let productPrice = '';

        try {
            const baseUrl = this.envUtils.getBaseUrl();
            await this.page.goto(`${baseUrl}${path}`, {
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });
            
            const currentUrl = this.getCurrentUrl();
            if (currentUrl.includes('/products/') && !currentUrl.includes('404')) {
                productName = path.replace('/products/', '').replace(/-/g, ' ');
                productPrice = await this.getProductPrice();
            } else {
                throw new Error('Could not navigate to product page directly');
            }
            
            return { name: productName, price: productPrice };
            
        } catch (error) {
            await this.captureScreenshot('navigate_to_product_direct_error');
            throw new Error(`Product Page - Navigate directly failed. Error: ${error}`);
        }
    }

    public async getProductPrice(): Promise<string> {
        try {
            const priceElement = this.page.locator(this.LOCATOR_PRICE).first();
            if (await priceElement.isVisible()) {
                const price = await priceElement.textContent();
                if (price) return price.trim();
            }
            return 'Price not found';
        } catch {
            return 'Price not found';
        }
    }

    public async addToCart(): Promise<boolean> {
        try {
            await this.page.waitForLoadState('domcontentloaded');
            await TestUtils.wait(3000);

            const addToCartButton = this.page.getByText(this.BTN_ADD_TO_CART_TEXT, { exact: true });
            
            if (await addToCartButton.isVisible() && await addToCartButton.isEnabled()) {
                await this.scrollToElement(addToCartButton, 'Add to cart button');
                await addToCartButton.click({ force: true, timeout: 5000 });
                await TestUtils.wait(2000);
                
                // Chỉ check 1 indicator duy nhất
                try {
                    await this.page.waitForSelector(this.LOCATOR_SUCCESS_MSG, { timeout: 2000 });
                } catch (e) {
                    console.log('Warning: Success message not detected, but button was clicked.');
                }
                
                return true;
            }
            return false;
        } catch (error) {
            await this.captureScreenshot('add_to_cart_error');
            return false;
        }
    }

    public async verifyPageIsLoaded(): Promise<void> {
        try {
            const currentUrl = this.getCurrentUrl();
            if (!currentUrl.includes('/products/')) {
                throw new Error(`Not on product page. Current URL: ${currentUrl}`);
            }
            
            await this.page.waitForLoadState('domcontentloaded');
            const addToCartButton = this.page.getByText(this.BTN_ADD_TO_CART_TEXT, { exact: true });
            await addToCartButton.waitFor({ state: 'attached', timeout: 5000 });
            
        } catch (error) {
            await this.captureScreenshot('product_page_verification_error');
            throw new Error(`Product Page verification failed. Error: ${error}`);
        }
    }
}