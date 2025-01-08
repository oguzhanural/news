# News Website Project

A modern news website built with Next.js frontend and Node.js TypeScript backend, utilizing GraphQL for efficient data fetching and MongoDB for data storage. The project implements a full-featured news management system with user authentication, role-based access control, and content management capabilities.

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Apollo Client for GraphQL
- Tailwind CSS
- Modern UI/UX design
- Responsive layout

### Backend
- Node.js
- TypeScript
- GraphQL with Apollo Server
- MongoDB with Mongoose
- Express.js
- JWT Authentication
- BCrypt for password hashing

## Project Structure

```
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/           # Utility functions and configurations
│   │   └── styles/        # Global styles and Tailwind config
│   └── package.json
│
├── backend/                 # Node.js TypeScript backend
│   ├── src/
│   │   ├── models/         # MongoDB Mongoose models
│   │   │   ├── User.ts     # User model with authentication
│   │   │   ├── News.ts     # News article model
│   │   │   └── Category.ts # Category model
│   │   ├── resolvers/      # GraphQL resolvers
│   │   │   ├── userResolver.ts    # User-related operations
│   │   │   ├── newsResolver.ts    # News-related operations
│   │   │   └── categoryResolver.ts # Category operations
│   │   ├── schemas/        # GraphQL type definitions
│   │   │   ├── user.graphql
│   │   │   ├── news.graphql
│   │   │   └── category.graphql
│   │   ├── utils/          # Helper functions
│   │   │   ├── db.ts       # Database connection
│   │   │   └── seedData.ts # Seed data utilities
│   │   └── scripts/        # Utility scripts
│   │       ├── seed.ts     # Database seeding
│   │       └── updatePassword.ts # Password update utility
│   └── package.json
```

## Features

### Implemented Features
- [x] User Authentication System
  - JWT-based authentication
  - Password hashing with BCrypt
  - Role-based authorization (ADMIN, EDITOR, JOURNALIST)
  
- [x] News Management
  - CRUD operations for news articles
  - Category management
  - Status tracking (DRAFT, PUBLISHED, ARCHIVED)
  - Tags support
  
- [x] User Management
  - User registration and login
  - Profile management
  - Role-based access control
  
- [x] Category System
  - Category CRUD operations
  - News article categorization

### Planned Features
- [ ] Frontend Implementation
- [ ] Comments System
- [ ] Search Functionality
- [ ] Image Upload
- [ ] Rich Text Editor
- [ ] Analytics Dashboard

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn
- Git

### Backend Setup

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd news/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   PORT=4000
   MONGO_USER=your_mongodb_user
   MONGO_PASS=your_mongodb_password
   MONGO_DB_NAME=your_database_name
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=24h
   ```

4. Seed the database with initial data:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The GraphQL server will be available at `http://localhost:4000/graphql`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd news/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## API Documentation

### Authentication

#### Login
```graphql
mutation {
  loginUser(input: {
    email: "your-email@example.com"
    password: "your-password"
  }) {
    token
    user {
      id
      name
      email
      role
    }
  }
}
```

#### Register
```graphql
mutation {
  registerUser(input: {
    name: "User Name"
    email: "email@example.com"
    password: "password"
    role: JOURNALIST
  }) {
    token
    user {
      id
      name
      email
      role
    }
  }
}
```

### News Operations

#### Create News
```graphql
mutation {
  createNews(input: {
    title: "News Title"
    content: "News Content"
    summary: "Brief summary"
    categoryId: "category-id"
    tags: ["tag1", "tag2"]
  }) {
    id
    title
    content
    status
  }
}
```

#### Update News
```graphql
mutation {
  updateNews(input: {
    id: "news-id"
    title: "Updated Title"
    content: "Updated Content"
    status: PUBLISHED
  }) {
    id
    title
    status
  }
}
```

## Development Workflow

1. Create a new branch for each feature/fix
2. Write tests (when implemented)
3. Submit pull requests
4. Code review
5. Merge to main branch

## Error Handling

The API implements consistent error handling with specific error codes:
- UNAUTHENTICATED: Authentication issues
- FORBIDDEN: Authorization issues
- NOT_FOUND: Resource not found
- BAD_USER_INPUT: Invalid input data
- INTERNAL_SERVER_ERROR: Server-side issues

## Security Considerations

- Passwords are hashed using BCrypt
- JWT tokens for authentication
- Role-based access control
- Input validation and sanitization
- MongoDB injection prevention
- CORS configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

Project Link: [https://github.com/oguzhanural/news-website](https://github.com/oguzhanural/news-website)
