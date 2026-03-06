import { setWorldConstructor, World, IWorldOptions, setDefaultTimeout } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
import { LoginPage } from '../../src/pages/login.page';
import { HomePage } from '../../src/pages/home.page';
import { ProductPage } from '../../src/pages/product.page';
import { CartPage } from '../../src/pages/cart.page';
import { TestUtils } from '../../src/utils/test.utils';
import { EnvUtils } from '../../src/utils/env.utils';

/**
 * Custom World class for Cucumber-Playwright integration
 * Provides browser management and page object instances for step definitions
 */
export class CustomWorld extends World {
    public browser!: Browser;
    public context!: BrowserContext;
    public page!: Page;
    public envUtils: EnvUtils;
    
    // Page Object Model instances
    public loginPage!: LoginPage;
    public homePage!: HomePage;
    public productPage!: ProductPage; 
    public cartPage!: CartPage;       
    
    // Test configuration
    private readonly config: {
        env: string;
        headless: boolean;
        baseUrl: string;
        browser: string;
        slowMo: number;
        timeout: number;
        screenshotOnFailure: boolean;
        screenshotDir: string;
        allureResults: string;
    };

    /**
     * Constructor for CustomWorld
     * @param options - World options from Cucumber
     */
    constructor(options: IWorldOptions) {
        super(options);
        
        // Initialize environment utilities
        this.envUtils = EnvUtils.getInstance();
        
        // Load configuration from world parameters
        this.config = {
            env: options.parameters?.env || process.env.ENV || 'default',
            headless: options.parameters?.headless !== false,
            baseUrl: options.parameters?.baseUrl || this.envUtils.getBaseUrl(),
            browser: options.parameters?.browser || this.envUtils.get('BROWSER', 'firefox'),
            slowMo: options.parameters?.slowMo || this.envUtils.getNumber('SLOW_MO', 0),
            timeout: options.parameters?.timeout || this.envUtils.getNumber('APP_TIMEOUT', 30000),
            screenshotOnFailure: options.parameters?.screenshotOnFailure !== false,
            screenshotDir: options.parameters?.screenshotDir || 'screenshots',
            allureResults: options.parameters?.allureResults || 'allure-results'
        };
        
        console.log(`Cucumber World initialized with config:`, this.config);
    }

    /**
     * Initialize browser, context, and page instances
     * Called before each scenario
     */
    public async init(): Promise<void> {
        try {
            console.log(`Initializing browser: ${this.config.browser}`);
            
            // Launch browser based on configuration
            this.browser = await this.launchBrowser();
            
            // Create browser context with configuration
            this.context = await this.browser.newContext({
                viewport: { 
                    width: this.envUtils.getNumber('VIEWPORT_WIDTH', 1920), 
                    height: this.envUtils.getNumber('VIEWPORT_HEIGHT', 1080) 
                },
                recordVideo: this.envUtils.getBoolean('RECORD_VIDEO', false) ? {
                    dir: 'test-results/videos',
                    size: { width: 1920, height: 1080 }
                } : undefined,
                recordHar: this.envUtils.getBoolean('RECORD_HAR', false) ? {
                    path: 'test-results/network.har'
                } : undefined
            });
            
            // Create new page
            this.page = await this.context.newPage();
            
            // Set default timeout
            this.page.setDefaultTimeout(this.config.timeout);
            
            // Configure slow motion if specified
            if (this.config.slowMo > 0) {
                await this.page.addInitScript(`
                    // Slow down the page for debugging
                    const originalSetTimeout = window.setTimeout;
                    window.setTimeout = function(callback, delay) {
                        return originalSetTimeout(callback, delay + ${this.config.slowMo});
                    };
                `);
            }
            
            // Initialize page objects
            this.initializePageObjects();
            
            console.log('Browser initialization completed successfully');
        } catch (error) {
            console.error('Browser initialization failed:', error);
            throw new Error(`Browser initialization failed: ${error}`);
        }
    }

    /**
     * Launch browser based on configuration
     * @returns Browser instance
     */
    private async launchBrowser(): Promise<Browser> {
        const launchOptions = {
            headless: this.config.headless,
            slowMo: this.config.slowMo,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        };

        switch (this.config.browser.toLowerCase()) {
            case 'firefox':
                return await firefox.launch(launchOptions);
            case 'webkit':
            case 'safari':
                return await webkit.launch(launchOptions);
            default:
                return await firefox.launch(launchOptions);
        }
    }

    /**
     * Initialize all page object instances
     */
    private initializePageObjects(): void {
        try {
            this.loginPage = new LoginPage(this.page);
            this.homePage = new HomePage(this.page);
            this.productPage = new ProductPage(this.page); // Khởi tạo ProductPage
            this.cartPage = new CartPage(this.page);       // Khởi tạo CartPage
            
            console.log('Page objects initialized successfully');
        } catch (error) {
            console.error('Page objects initialization failed:', error);
            throw new Error(`Page objects initialization failed: ${error}`);
        }
    }

    /**
     * Capture screenshot with scenario context
     * @param stepName - Name of the step or scenario
     * @returns Screenshot file path
     */
    public async captureScreenshot(stepName: string): Promise<string> {
        if (!this.page) {
            throw new Error('Page not initialized. Call init() first.');
        }
        
        const scenarioName: string = 'cucumber_scenario';
        return await TestUtils.captureScreenshot(
            this.page, 
            scenarioName.replace(/\s+/g, '_').toLowerCase(), 
            stepName
        );
    }

    /**
     * Cleanup browser resources
     * Called after each scenario
     */
    public async cleanup(): Promise<void> {
        try {
            console.log('Cleaning up browser resources...');
            
            // Capture screenshot on failure if enabled
            if (this.config.screenshotOnFailure) {
                try {
                    await this.captureScreenshot('scenario_failure');
                } catch (screenshotError) {
                    console.warn('Failed to capture failure screenshot:', screenshotError);
                }
            }
            
            // Close browser resources
            if (this.page && !this.page.isClosed()) {
                await this.page.close();
            }
            
            if (this.context) {
                await this.context.close();
            }
            
            if (this.browser) {
                await this.browser.close();
            }
            
            console.log('Browser cleanup completed');
        } catch (error) {
            console.warn('Browser cleanup failed:', error);
            // Don't throw error in cleanup to avoid masking scenario failure
        }
    }

    /**
     * Navigate to application base URL
     * @param path - Optional path to append to base URL
     */
    public async navigateToApp(path: string = ''): Promise<void> {
        if (!this.page) {
            throw new Error('Page not initialized. Call init() first.');
        }
        
        try {
            const fullUrl: string = path ? 
                `${this.config.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}` : 
                this.config.baseUrl;
            
            console.log(`Navigating to: ${fullUrl}`);
            await this.page.goto(fullUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: this.config.timeout
            });
            
            await TestUtils.waitForPageLoad(this.page, this.config.timeout);
        } catch (error) {
            await this.captureScreenshot('navigation_error');
            throw new Error(`Navigation failed: ${error}`);
        }
    }

    /**
     * Get test credentials from environment
     * @returns Test user credentials
     */
    public getTestCredentials(): { phone: string; password: string } {
        return this.envUtils.getTestCredentials();
    }

    /**
     * Wait for application to be ready
     */
    public async waitForApplicationReady(): Promise<void> {
        if (!this.page) {
            throw new Error('Page not initialized. Call init() first.');
        }
        
        await TestUtils.waitForPageLoad(this.page, this.config.timeout);
    }

    /**
     * Get current page URL
     * @returns Current page URL
     */
    public getCurrentUrl(): string {
        if (!this.page) {
            throw new Error('Page not initialized. Call init() first.');
        }
        
        return this.page.url();
    }

    /**
     * Get page title
     * @returns Page title
     */
    public async getPageTitle(): Promise<string> {
        if (!this.page) {
            throw new Error('Page not initialized. Call init() first.');
        }
        
        return await this.page.title();
    }
}

// Set the custom World constructor for Cucumber
setWorldConstructor(CustomWorld);

// Set default timeout for Cucumber steps (in milliseconds)
setDefaultTimeout(60000);

export default CustomWorld;