Feature: User Login
  As a user of the Levents application
  I want to be able to log in to my account
  So that I can access personalized features and make purchases

  Background:
    Given I am on the Levents homepage

  @smoke @login @critical
  Scenario: Successful login with valid credentials
    When I navigate to the login page from homepage
    And I enter valid phone number and password
    Then I should be successfully logged in

  @login @negative
  Scenario: Login failed with invalid credentials should stay on login page
    When I navigate to the login page from homepage
    And I enter invalid credentials
    Then I should remain on the login page