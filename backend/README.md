# News Management Backend

This project implements a GraphQL-based news management backend with MongoDB for storage.

## Features

### News Management

- **Create News Articles**: Create news articles with rich text content, images, tags, and category.
- **Update News Articles**: Update existing news articles with proper permission checks.
- **Delete News Articles**: Delete news articles with cleanup of associated resources.
- **Cloudinary Integration**: Seamless integration with Cloudinary for image management.
- **Rich Text Support**: Support for rich text content with embedded images and HTML sanitization.
- **Search Functionality**: Full-text search across news articles with filtering options.

### User Management

- **Authentication & Authorization**: JWT-based authentication with role-based authorization.
- **User Roles**: Support for EDITOR, JOURNALIST, ADMIN, and READER roles.
- **Secure Password Handling**: Bcrypt-based password hashing and proper password validation.

### Content Security

- **HTML Sanitization**: DOMPurify-based sanitization to prevent XSS attacks.
- **Image Validation**: Validation of images to ensure they are from trusted sources.
- **Permission Checks**: Proper permission checks for all operations.

## Architecture

### Models

- **News**: Represents a news article with title, content, images, and metadata.
- **User**: Represents a user with authentication and authorization details.
- **Category**: Represents a news category.

### Utilities

- **Cloudinary**: Utility functions for interacting with Cloudinary.
- **Content Processing**: Functions for rich text processing, sanitization, and summary generation.
- **JWT**: Utilities for JWT-based authentication.

## Integration with Admin Dashboard

The backend integrates with a separate admin dashboard application for news management. Key integration points:

1. **GraphQL API**: The backend exposes a GraphQL API for all news management operations.
2. **Cloudinary**: Both applications use Cloudinary for image management.
3. **Rich Text Editor**: The admin dashboard uses a rich text editor that embeds Cloudinary images.

## Environment Configuration

Required environment variables:

```
# Server Configuration
PORT=4000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/news_database

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your values
3. Install dependencies: `npm install`
4. Start the server: `npm run dev`

## API Usage Examples

### Creating a News Article

```graphql
mutation CreateNews($input: CreateNewsInput!) {
  createNews(input: $input) {
    id
    title
    summary
    status
    publishDate
  }
}
```

Variables:
```json
{
  "input": {
    "title": "Sample News Article",
    "content": "<p>This is a sample news article with <strong>rich text</strong>.</p>",
    "summary": "A brief summary of the news article",
    "categoryId": "category_id_here",
    "status": "DRAFT",
    "tags": ["sample", "news"],
    "images": [
      {
        "url": "https://res.cloudinary.com/your-cloud/image/upload/sample.jpg",
        "isMain": true,
        "caption": "Main image",
        "altText": "Sample image"
      }
    ]
  }
}
``` 