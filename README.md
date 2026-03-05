# Playwright TypeScript E2E Testing Framework

A comprehensive end-to-end testing framework built with Playwright, TypeScript, Cucumber, and Allure reporting for automated testing of the Levents e-commerce application.

## 🚀 Features

- **Page Object Model (POM)** - Organized and maintainable test structure
- **TypeScript Support** - Type-safe test development with IntelliSense
- **Cucumber BDD** - Behavior-driven development with Gherkin syntax  
- **Allure Reporting** - Rich test reports with screenshots and metadata
- **Multi-Environment Support** - QA, Staging, and Production environments
- **Cross-Browser Testing** - Chrome, Firefox, Safari, and mobile browsers
- **Enhanced Error Handling** - Detailed error messages and screenshot capture
- **Retry Mechanisms** - Automatic retry on test failures
- **Parallel Execution** - Fast test execution with parallel test runs
- **CI/CD Ready** - Optimized for continuous integration pipelines

## 📁 Project Structure

```
playwright_ts/
├── src/
│   ├── pages/              # Page Object Model classes
│   │   ├── base.page.ts
│   │   ├── login.page.ts
│   │   └── home.page.ts
│   ├── tests/              # Playwright test files
│   │   ├── base.test.ts
│   │   └── login.test.ts
│   └── utils/              # Utility classes
│       ├── env.utils.ts
│       ├── test.utils.ts
│       └── allure.utils.ts
├── features/               # Cucumber feature files and step definitions
│   ├── login.feature
│   ├── step_definitions/
│   │   └── login.steps.ts
│   └── support/
│       ├── world.ts
│       └── hooks.ts
├── .env                    # Default environment configuration
├── qa.env                  # QA environment configuration
├── stg.env                 # Staging environment configuration
├── playwright.config.ts    # Playwright configuration
├── cucumber.config.js      # Cucumber configuration
└── tsconfig.json          # TypeScript configuration
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation Steps

1. **Clone the repository (or navigate to project directory)**
   ```bash
   cd playwright_ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npm run install:browsers
   ```

4. **Install Allure CLI (optional - for report generation)**
   ```bash
   npm install -g allure-commandline
   ```

## 🔧 Configuration

### Environment Variables

The framework supports multiple environment configurations:

- **`.env`** - Default configuration
- **`qa.env`** - QA environment settings
- **`stg.env`** - Staging environment settings

Key environment variables:
```bash
# Application Configuration
BASE_URL=https://www.levents.asia/
APP_TIMEOUT=30000

# Test Credentials
TEST_PHONE=0393769194
TEST_PASSWORD=Anhlong1112

# Browser Configuration  
BROWSER=chromium
HEADED=false
SLOW_MO=0

# Reporting Configuration
ALLURE_RESULTS_DIR=allure-results
SCREENSHOT_DIR=screenshots
```

### Browser Configuration

Configure browser settings in environment files:
- `BROWSER`: chromium, firefox, webkit
- `HEADED`: true/false (show browser UI)
- `SLOW_MO`: milliseconds to slow down operations
- `VIEWPORT_WIDTH/HEIGHT`: browser viewport size

## 🧪 Running Tests

### Playwright Tests

```bash
# Run all tests (headless)
npm test

# Run tests with browser UI
npm run test:headed

# Run specific test suite
npm run test:login

# Run by tags
npm run test:smoke
npm run test:regression

# Run with debug mode
npm run test:debug

# Run tests with UI mode
npm run test:ui
```

### Environment-Specific Execution

```bash
# Run tests in QA environment
npm run test:qa

# Run tests in staging environment  
npm run test:stg
```

### Cucumber BDD Tests

```bash
# Run Cucumber tests
npm run cucumber

# Run with browser UI
npm run cucumber:headed

# Run in specific environment
npm run cucumber:qa
npm run cucumber:stg
```

### Parallel Execution

Tests run in parallel by default. Configure workers in `playwright.config.ts`:
```typescript
workers: process.env.CI ? 2 : 4
```

## 📊 Reporting

### Allure Reports

Generate and view comprehensive test reports:

```bash
# Generate Allure report
npm run allure:generate

# Open report in browser
npm run allure:open

# Generate and open in one command
npm run report

# Serve report (auto-refresh)
npm run allure:serve
```

### Built-in Reports

Playwright generates HTML reports automatically:
- Location: `test-results/html-report/`
- Open with: Browser after test execution

## 📖 Writing Tests

### Page Object Model Example

```typescript
// src/pages/login.page.ts
export class LoginPage extends BasePage {
    // Fixed locators in constructor
    private readonly input_PhoneNumber: string;
    
    constructor(page: Page) {
        super(page);
        this.input_PhoneNumber = "//input[@id='phone']";
    }
    
    // Dynamic locator as getter
    public locatorErrorMessageByText(errorText: string): Locator {
        return this.page.locator(`//div[contains(text(), '${errorText}')]`);
    }
    
    // Page actions
    public async performLogin(phone: string, password: string): Promise<void> {
        await this.enterPhoneNumber(phone);
        await this.enterPassword(password);
        await this.clickLoginButton();
    }
}
```

### Playwright Test Example

```typescript
// src/tests/login.test.ts
import { test, expect } from '../tests/base.test';
import { LoginPage } from '../pages/login.page';

test('Successful login @smoke @login', async ({ baseTest }) => {
    const loginPage = new LoginPage(baseTest.page);
    
    await AllureUtils.step('Navigate to login', async () => {
        await loginPage.navigateToLogin();
    });
    
    await AllureUtils.step('Perform login', async () => {
        const credentials = baseTest.getTestCredentials();
        await loginPage.performLogin(credentials.phone, credentials.password);
    });
});
```

### Cucumber Feature Example

```gherkin
# features/login.feature
Feature: User Login
  @smoke @login @critical
  Scenario: Successful login with valid credentials
    Given I am on the Levents homepage
    When I navigate to the login page
    And I enter valid phone number and password
    And I click the login button
    Then I should be successfully logged in
```

### Step Definition Example

```typescript
// features/step_definitions/login.steps.ts
When('I enter valid phone number and password', async function (this: CustomWorld) {
    const credentials = this.getTestCredentials();
    await this.loginPage.enterPhoneNumber(credentials.phone);
    await this.loginPage.enterPassword(credentials.password);
});
```

## 🏷️ Test Tags and Categories

### Available Tags

- **@smoke** - Quick smoke tests
- **@regression** - Comprehensive regression tests  
- **@login** - Login functionality tests
- **@critical** - Critical path tests
- **@negative** - Negative test scenarios
- **@performance** - Performance validation tests

### Running by Tags

```bash
# Playwright tags (using grep)
npx playwright test --grep "@smoke"
npx playwright test --grep "@login"

# Cucumber tags
CUCUMBER_TAGS="@smoke" npm run cucumber
CUCUMBER_TAGS="@regression and not @skip" npm run cucumber
```

## 🔍 Debugging

### Debug Mode

```bash
# Run single test in debug mode
npm run test:debug

# Run specific test file
npx playwright test src/tests/login.test.ts --debug

# Run with headed browser
npm run test:headed
```

### Screenshots and Videos

- **Screenshots**: Captured automatically on failure
- **Videos**: Enable in environment variables (`RECORD_VIDEO=true`)
- **Traces**: Available in test results for debugging

### Console Logs

The framework captures and logs:
- Browser console messages  
- Network requests/responses
- Playwright actions and assertions
- Custom test step logs

## Performance Optimization

### Parallel Execution
- Tests run in parallel by default
- Configure workers based on environment
- Use test isolation for reliable results

### Resource Management  
- Automatic browser cleanup
- Screenshot and artifact cleanup
- Configurable timeout values

### CI/CD Optimization
- Headless execution for CI
- Reduced parallel workers for stability
- Retry mechanisms for flaky tests

## Error Handling

### Comprehensive Error Messages
```typescript
// Example of enhanced error message
throw new Error(
    `Login failed for user ${phone.substring(0, 3)}***. ` +
    `Current URL: ${this.getCurrentUrl()}. ` +
    `Error: ${error}`
);
```

### Automatic Screenshot Capture
- Screenshots on test failures
- Screenshots on assertion errors
- Before/after step screenshots

### Retry Mechanisms
- Configurable retry counts
- Element interaction retries
- Network request retries

## Security Best Practices

### Credential Management
- Environment-based credential storage
- Masked credentials in logs and reports
- No hardcoded sensitive data

### Test Data Protection
- Sanitized screenshots (no sensitive data)
- Secure environment variable handling
- Test data cleanup after execution



### Test Organization
1. Use Page Object Model pattern
2. Define locators outside constructor
3. Use descriptive test names and comments
4. Group related tests in describe blocks

### Error Handling
1. Use try-catch blocks for better error messages
2. Capture screenshots on failures
3. Add context to error messages
4. Implement retry mechanisms

### Maintenance
1. Regular dependency updates
2. Clean up old test artifacts
3. Review and update test data
4. Monitor test performance

## Contributing

### Code Standards
- Use TypeScript strict mode
- Follow ESLint configuration
- Add JSDoc comments for public methods
- Use meaningful variable and function names

### Test Standards  
- Write descriptive test cases
- Use appropriate tags for categorization
- Include both positive and negative scenarios
- Add performance validations where applicable

## Support

For issues and questions:
1. Check the test reports for detailed error information
2. Review the console logs for debugging information
3. Ensure environment configuration is correct
4. Verify browser installations are up to date

## Maintenance Checklist

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Clean up old test artifacts weekly  
- [ ] Review and update test data
- [ ] Monitor test execution performance
- [ ] Update browser versions
- [ ] Review and optimize flaky tests

### Environment Updates
- [ ] Verify environment configurations
- [ ] Update credentials if changed
- [ ] Test different browser versions
- [ ] Validate CI/CD pipeline execution

---

## Quick Start

1. **Install dependencies**: `npm install`
2. **Install browsers**: `npm run install:browsers`  
3. **Run smoke tests**: `npm run test:smoke`
4. **View report**: `npm run report`