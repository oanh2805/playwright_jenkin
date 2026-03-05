Feature: User Login
  As a user of the Levents application
  I want to be able to log in to my account
  So that I can access personalized features and make purchases
 
  Background:
    Given I am on the Levents homepage

Examples:
      | phone         | password     | result                    |
      | 0393769194    | Anhlong1112  | successfully logged in    |
      | 0393769194    | wrong        | error message             |
      | 1234567890    | correct      | error message             |
      | ""            | ""           | validation error messages |

  @smoke @login @critical
  Scenario: Successful login with valid credentials
    Given I navigate to the login page from homepage
    When I enter valid phone number and password
    And I click the login button
    Then I should be successfully logged in
    And I should see the homepage
    And I should see user profile menu

  @login @negative
  Scenario: Failed login with invalid phone number
    Given I navigate to the login page from homepage
    When I enter invalid phone number "1234567890"
    And I enter valid password
    And I click the login button
    Then I should see an error message
    And I should remain on the login page

  @login @negative
  Scenario: Failed login with invalid password
    Given I navigate to the login page from homepage
    When I enter valid phone number
    And I enter invalid password "wrongpassword"
    And I click the login button
    Then I should see an error message
    And I should remain on the login page
 
    