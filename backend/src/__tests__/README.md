# Backend Test Documentation

This document provides a comprehensive overview of all test cases implemented in the backend of our news application.

## Test Architecture

### Directory Structure
```
__tests__/
├── models/              # Model validation tests
│   ├── User.test.ts
│   ├── News.test.ts
│   └── Category.test.ts
├── resolvers/          # GraphQL resolver tests
│   ├── userResolver.test.ts
│   ├── newsResolver.test.ts
│   └── categoryResolver.test.ts
└── setup.ts           # Test environment configuration
```

### Test Environment
- Uses in-memory MongoDB for isolation
- Clears database between tests
- Provides utility functions for database operations
- Handles authentication tokens for testing

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

### News Model (`News.test.ts`)
Tests for news article data model validation:

- ✓ Basic Operations
  - Should create a valid news article
  - Should generate unique slug from title
  - Should validate required fields
  - Should validate status enum values

- ✓ Image Handling
  - Should require at least one image
  - Should require exactly one main image
  - Should validate image URL format
  - Should handle multiple images correctly

- ✓ Slug Generation
  - Should generate SEO-friendly slugs
  - Should handle duplicate titles with unique slugs
  - Should maintain slug uniqueness across updates

- ✓ Search Indexing
  - Should create text indexes for searchable fields
  - Should index title, content, summary, and tags

### Category Model (`Category.test.ts`)
Tests for category data model validation:

- ✓ Basic Operations
  - Should create & save category successfully
  - Should fail to save category without required fields
  - Should generate slug from name
  - Should prevent duplicate category names

## Resolver Tests

### User Resolver (`userResolver.test.ts`)
Tests for user-related GraphQL operations:

- ✓ Authentication
  - Should register new users
  - Should login users with correct credentials
  - Should handle invalid credentials
  - Should manage JWT tokens

- ✓ Authorization
  - Should enforce role-based access
  - Should prevent unauthorized access
  - Should allow admin operations
  - Should restrict user operations

- ✓ User Management
  - Should update user profiles
  - Should handle password changes
  - Should manage user roles
  - Should delete user accounts

### News Resolver (`newsResolver.test.ts`)
Tests for news-related GraphQL operations:

- ✓ Query Operations
  - Should fetch single news article
  - Should list news articles
  - Should handle pagination
  - Should filter by category and status

- ✓ Mutation Operations
  - Should create news articles
  - Should update existing articles
  - Should handle image updates
  - Should manage article status

- ✓ Search Functionality
  - Should perform full-text search
  - Should filter search results by status
  - Should filter by tags
  - Should handle search pagination
  - Should sort by relevance
  - Should return total count and hasMore flag

- ✓ Authorization Rules
  - Should enforce author permissions
  - Should allow admin overrides
  - Should prevent unauthorized updates
  - Should restrict deletion rights

### Category Resolver (`categoryResolver.test.ts`)
Tests for category-related GraphQL operations:

- ✓ Queries
  - Should fetch all categories
  - Should handle category filtering

- ✓ Mutations
  - Should create categories when authenticated
  - Should prevent duplicate categories
  - Should update existing categories
  - Should delete categories with proper authorization

## Running Tests

### Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Coverage Requirements
- Models: Minimum 90% coverage
- Resolvers: Minimum 80% coverage
- Overall: Minimum 85% coverage

## Best Practices

### Test Organization
- Use descriptive test names
- Group related tests using describe blocks
- Follow AAA pattern (Arrange, Act, Assert)
- Clean up test data after each test

### Mocking and Stubs
- Use in-memory database for tests
- Mock external services when necessary
- Provide test utilities for common operations
- Maintain test isolation

### Error Handling
- Test both success and error cases
- Verify error messages and codes
- Test edge cases and boundary conditions
- Ensure proper error propagation

### Authentication & Authorization
- Test with different user roles
- Verify token validation
- Test permission boundaries
- Check access control rules

## Continuous Integration
- Tests run on every pull request
- Coverage reports generated automatically
- Failed tests block merging
- Performance metrics tracked 

## GraphQL Query Examples

### News API Queries

#### Fetch Single News Article
```graphql
query GetNewsById {
  news(id: "news-id") {
    id
    title
    content
    summary
    slug
    status
    author {
      id
      name
      email
    }
    category {
      id
      name
    }
    tags
    images {
      url
      isMain
    }
    createdAt
    updatedAt
  }
}
```

#### List News Articles with Filtering
```graphql
query GetNewsList(
  $status: NewsStatus
  $categoryId: ID
  $limit: Int
  $offset: Int
) {
  newsList(
    status: $status
    categoryId: $categoryId
    limit: $limit
    offset: $offset
  ) {
    id
    title
    summary
    status
    category {
      name
    }
    author {
      name
    }
    createdAt
  }
}
```

#### Search News Articles
```graphql
query SearchNews(
  $query: String!
  $status: NewsStatus
  $categoryId: ID
  $tags: [String!]
  $fromDate: String
  $toDate: String
  $limit: Int
  $offset: Int
) {
  searchNews(input: {
    query: $query
    status: $status
    categoryId: $categoryId
    tags: $tags
    fromDate: $fromDate
    toDate: $toDate
    limit: $limit
    offset: $offset
  }) {
    news {
      id
      title
      summary
      status
      tags
      category {
        name
      }
      createdAt
    }
    total
    hasMore
  }
}
```

### News API Mutations

#### Create News Article
```graphql
mutation CreateNews($input: CreateNewsInput!) {
  createNews(input: $input) {
    id
    title
    content
    summary
    slug
    status
    tags
    images {
      url
      isMain
    }
    category {
      id
      name
    }
    author {
      id
      name
    }
    createdAt
  }
}

# Variables example:
{
  "input": {
    "title": "New Article Title",
    "content": "Article content here...",
    "summary": "Brief summary",
    "categoryId": "category-id",
    "tags": ["technology", "ai"],
    "images": [
      {
        "url": "https://example.com/image.jpg",
        "isMain": true
      }
    ]
  }
}
```

#### Update News Article
```graphql
mutation UpdateNews($input: UpdateNewsInput!) {
  updateNews(input: $input) {
    id
    title
    content
    summary
    status
    tags
    images {
      url
      isMain
    }
    updatedAt
  }
}

# Variables example:
{
  "input": {
    "id": "news-id",
    "title": "Updated Title",
    "content": "Updated content",
    "status": "PUBLISHED",
    "tags": ["updated", "tags"]
  }
}
```

#### Delete News Article
```graphql
mutation DeleteNews($id: ID!) {
  deleteNews(id: $id)
}

# Variables:
{
  "id": "news-id"
}
```

### Testing Tips

#### Authentication Headers
```javascript
// Include in HTTP headers
{
  "Authorization": "Bearer your-jwt-token"
}
```

#### Example Test Cases
1. Create and then update article:
```javascript
// First create article
const createResponse = await request(graphqlEndpoint, createNewsMutation, {
  input: {
    title: "Test Article",
    content: "Content",
    summary: "Summary",
    categoryId: "cat-id",
    images: [{ url: "image.jpg", isMain: true }]
  }
}, headers);

const newsId = createResponse.createNews.id;

// Then update it
const updateResponse = await request(graphqlEndpoint, updateNewsMutation, {
  input: {
    id: newsId,
    title: "Updated Title",
    status: "PUBLISHED"
  }
}, headers);
```

2. Search with filters:
```javascript
const searchResponse = await request(graphqlEndpoint, searchNewsQuery, {
  query: "technology",
  status: "PUBLISHED",
  tags: ["ai"],
  limit: 10,
  offset: 0
}, headers);
``` 