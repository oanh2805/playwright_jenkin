const config = {
    // Feature files location
    paths: ['features/**/*.feature'],
    
    // Step definitions and support files
    require: [
        'features/step_definitions/**/*.ts',
        'features/support/**/*.ts'
    ],
    
    // TypeScript configuration
    requireModule: ['ts-node/register'],
    
    // Output format
    format: [
        'progress-bar',
        'json:test-results/cucumber-report.json',
        'html:test-results/cucumber-report.html',
        '@cucumber/pretty-formatter'
    ],
    
    // Parallel execution
    parallel: 2,
    
    // Retry configuration
    retry: 1,
    
    // Tag expressions for filtering scenarios
    tags: process.env.CUCUMBER_TAGS || '',
    
    // World parameters
    worldParameters: {
        // Environment configuration
        env: process.env.ENV || 'default',
        headless: process.env.HEADED !== 'true',
        baseUrl: process.env.BASE_URL || 'https://www.levents.asia/',
        
        // Browser configuration
        browser: process.env.BROWSER || 'chromium',
        slowMo: parseInt(process.env.SLOW_MO || '0', 10),
        timeout: parseInt(process.env.APP_TIMEOUT || '30000', 10),
        
        // Screenshot configuration
        screenshotOnFailure: true,
        screenshotDir: 'screenshots',
        
        // Allure configuration
        allureResults: 'allure-results'
    },
    
    // Publish results
    publish: false,
    
    // Dry run option
    dryRun: false,
    
    // Fail fast option
    failFast: false,
    
    // Strict mode
    strict: true
};

module.exports = config;