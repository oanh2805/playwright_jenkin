Feature: Shopping Cart Functionality
  As a logged-in user of the Levents application
  I want to be able to add products to my shopping cart
  So that I can purchase them later

  Background:
    Given I am logged in to the application

  @smoke @cart @ecommerce
  Scenario: Add product to cart after successful login
    When I select a product from the home page
    And I add the product to the cart
    Then I should be able to navigate to the shopping cart
    And the cart items count should be greater than zero