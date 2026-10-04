# menu-catalog Specification

## Purpose
Rules for categories, products and product recipes.

## Requirements

### Requirement: Categories are ordered, toggleable and protected from deletion while in use
Each category SHALL have a `sortOrder` controlling display order and an `isActive` flag. A category with linked products SHALL NOT be deletable.

#### Scenario: Delete category with products
- **WHEN** a category that has products is deleted
- **THEN** the request fails and the category remains

### Requirement: Products belong to a category and carry availability
Every product SHALL belong to a category and have `isAvailable`. `ToggleAvailability` SHALL flip it.

#### Scenario: Toggle availability
- **WHEN** availability is toggled on an available product
- **THEN** the product becomes unavailable (and vice versa)

### Requirement: Recipes link products to ingredients
A product MAY have zero or more recipe lines (`product_ingredients`), each with the `quantity` of the ingredient needed per product unit. Adding a line SHALL require both the product and the ingredient to exist.

#### Scenario: Add recipe line for missing ingredient
- **WHEN** an ingredient that does not exist is added to a product
- **THEN** the request fails with a not-found error
