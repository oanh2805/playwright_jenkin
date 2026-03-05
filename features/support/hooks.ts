import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';
import { TestUtils } from '../../src/utils/test.utils';

/**
 * Global setup - runs once before all scenarios
 */
BeforeAll(async function () {
    console.log('Starting Cucumber test execution');
    console.log('📋 Global setup - Preparing test environment');
    
    try {
        // Clean up any existing artifacts
        await TestUtils.cleanupTestArtifacts(0); // Clean all old artifacts
        console.log('Global setup completed successfully');
    } catch (error) {
        console.warn('Global setup warning:', error);
    }
});

/**
 * Global teardown - runs once after all scenarios
 */
AfterAll(async function () {
    console.log('Cucumber test execution completed');
    console.log('Global teardown - Cleaning up test environment');
    
    try {
        // Perform final cleanup
        await TestUtils.cleanupTestArtifacts(10); // Keep 10 latest artifacts
        console.log('Global teardown completed successfully');
    } catch (error) {
        console.warn('Global teardown warning:', error);
    }
});

/**
 * Scenario setup - runs before each scenario
 */
Before(async function (this: CustomWorld, scenario) {
    console.log(`\nStarting scenario: ${scenario.pickle.name}`);
    console.log(`Feature: ${scenario.gherkinDocument.feature?.name}`);
    console.log(`Tags: ${scenario.pickle.tags.map(tag => tag.name).join(', ')}`);
    
    try {
        // Initialize browser and page objects
        await this.init();
        
        console.log('Scenario setup completed successfully');
    } catch (error) {
        console.error('Scenario setup failed:', error);
        throw error;
    }
});

/**
 * Scenario teardown - runs after each scenario
 */
After(async function (this: CustomWorld, scenario) {
    const scenarioStatus = scenario.result?.status || Status.UNKNOWN;
    const scenarioName = scenario.pickle.name;
    
    console.log(`\nCompleting scenario: ${scenarioName}`);
    console.log(`Status: ${scenarioStatus}`);
    
    try {
        // Capture final screenshot for the scenario
        if (this.page && !this.page.isClosed()) {
            const screenshotEvent = scenarioStatus === Status.PASSED ? 'scenario_passed' : 'scenario_completed';
            await this.captureScreenshot(screenshotEvent);
        }
        
        // If scenario failed, capture additional debug information
        if (scenarioStatus === Status.FAILED) {
            await handleScenarioFailure.call(this, scenario);
        }
        
    } catch (error) {
        console.warn('Error during scenario teardown logging:', error);
    } finally {
        // Always cleanup browser resources
        await this.cleanup();
        console.log('Scenario teardown completed');
    }
});

/**
 * Handle scenario failure - capture debug information
 */
async function handleScenarioFailure(this: CustomWorld, scenario: any): Promise<void> {
    try {
        console.log('Capturing failure debug information...');
        
        if (this.page && !this.page.isClosed()) {
            // Capture failure screenshot
            await this.captureScreenshot('failure_debug');
            
            // Log current page information
            const currentUrl = this.getCurrentUrl();
            const pageTitle = await this.getPageTitle();
            
            console.log(`Failed on page: ${pageTitle}`);
            console.log(`URL: ${currentUrl}`);
            
            // Attach information to scenario for reporting
            if (scenario.attach) {
                // Attach URL
                scenario.attach(currentUrl, 'text/plain');
                
                // Attach page title
                scenario.attach(pageTitle, 'text/plain');
                
                // Attach browser console logs if available
                // Note: Console logs would need to be collected during scenario execution
            }
        }
        
    } catch (error) {
        console.warn('Failed to capture failure debug information:', error);
    }
}

/**
 * Tagged hooks - specific setup for different types of scenarios
 */

/**
 * Setup for login scenarios
 */
Before({ tags: '@login' }, async function (this: CustomWorld) {
    console.log('Login scenario detected - Additional setup');
    
    try {
        // Ensure we start from home page for login scenarios
        await this.navigateToApp();
        await this.waitForApplicationReady();
        
        console.log('Login scenario setup completed');
    } catch (error) {
        console.error('Login scenario setup failed:', error);
        throw error;
    }
});

/**
 * Setup for smoke test scenarios
 */
Before({ tags: '@smoke' }, async function (this: CustomWorld) {
    console.log('Smoke test scenario detected - Quick verification setup');
    
    try {
        // Smoke tests might need faster timeouts or specific configurations
        this.page.setDefaultTimeout(15000); // Faster timeout for smoke tests
        
        console.log('Smoke test scenario setup completed');
    } catch (error) {
        console.error('Smoke test scenario setup failed:', error);
        throw error;
    }
});

/**
 * Setup for regression test scenarios
 */
Before({ tags: '@regression' }, async function (this: CustomWorld) {
    console.log('Regression test scenario detected - Comprehensive setup');
    
    try {
        // Regression tests might need longer timeouts or additional setup
        this.page.setDefaultTimeout(60000); // Longer timeout for regression tests
        
        console.log('Regression test scenario setup completed');
    } catch (error) {
        console.error('Regression test scenario setup failed:', error);
        throw error;
    }
});

/**
 * Cleanup for scenarios that require logout
 */
After({ tags: '@requireLogout' }, async function (this: CustomWorld) {
    console.log('Post-scenario logout required');
    
    try {
        if (this.page && !this.page.isClosed() && this.homePage) {
            // Check if user is logged in and logout if needed
            const userMenuAvailable = await this.homePage.isUserMenuAvailable();
            if (userMenuAvailable) {
                await this.homePage.logout();
                console.log('User logged out successfully');
            }
        }
    } catch (error) {
        console.warn('Logout failed during cleanup:', error);
        // Don't throw error in cleanup
    }
});