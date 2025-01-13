# Backend Test Documentation

This document provides an overview of all test cases implemented in the backend of our news application.

## Test Structure

The tests are organized into several test suites, each focusing on specific components:

1. Model Tests
2. Resolver Tests

## Model Tests

### User Model (`User.test.ts`)
Tests for user data model validation and operations:

- ✓ Creation & Validation
  - Should create & save user successfully
  - Should fail to save user without required fields
  - Should fail to save user with invalid email
  - Should fail to save user with invalid role

- ✓ Security Features
  - Should prevent duplicate email addresses
  - Should correctly compare passwords
  - Should hash password before saving
  - Should not rehash password if not modified

### Category Model (`Category.test.ts`)
Tests for category data model validation:

- ✓ Basic Operations
  - Should create & save category successfully
  - Should fail to save category without required fields
  - Should generate slug from name
  - Should prevent duplicate category names

### News Model (`News.test.ts`)
Tests for news article data model validation:

- ✓ Creation & Validation
  - Should create a valid news article
  - Should require at least one image
  - Should require exactly one main image
  - Should generate a unique slug from title
  - Should validate required fields
  - Should validate status enum values

## Resolver Tests

### User Resolver (`userResolver.test.ts`)
Tests for user-related GraphQL operations:

- ✓ Queries
  - Should fetch all users when authenticated as admin
  - Should fail to fetch users without admin role

- ✓ Mutations
  - Registration
    - Should register a new user
    - Should fail to register user with existing email
  
  - Authentication
    - Should login user with correct credentials
    - Should fail to login with incorrect password
  
  - User Management
    - Should update user when authenticated
    - Should fail to update other user without admin role
    - Should delete user when authenticated as admin
    - Should allow user to delete their own profile
    - Should prevent non-admin user from deleting other users

- ✓ Role-based Update Permissions
  - Should allow admin to update any user's all fields
  - Should allow non-admin user to update their own basic information
  - Should prevent non-admin user from updating their role
  - Should prevent non-admin user from updating other users

### Category Resolver (`categoryResolver.test.ts`)
Tests for category-related GraphQL operations:

- ✓ Queries
  - Should fetch all categories

- ✓ Mutations
  - Should create a new category when authenticated
  - Should fail to create category with duplicate name
  - Should fail to create category without authentication
  - Should update an existing category
  - Should delete a category

### News Resolver (`newsResolver.test.ts`)
Tests for news-related GraphQL operations:

- ✓ Queries
  - Should return a news article by id
  - Should throw error for non-existent news
  - Should return list of news articles
  - Should filter by category
  - Should filter by status

- ✓ Mutations
  - Should create a news article
  - Should throw error when not authenticated
  - Should update a news article
  - Should throw error when updating non-existent news
  - Should throw error when user is not author

## Running Tests

To run all tests:
```bash
npm test
```

## Test Environment

- Tests use an in-memory MongoDB database
- Each test suite runs in isolation
- Database is cleared between each test
- Authentication tokens are generated for testing purposes
- GraphQL operations are tested using Apollo Server test utilities 