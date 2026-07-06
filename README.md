# CodeFunda | Online Coding Practice Platform - Backend

A high-performance Node.js backend server for CodeFunda, a comprehensive online coding practice platform optimized for 200+ concurrent users with sub-200ms API response times and 35% optimized data retrieval.

## 🎯 Overview

CodeFunda Backend is a production-grade Express.js server built to power the CodeFunda coding practice platform. Designed with performance optimization, scalability, and robust database architecture to handle high-volume concurrent users executing code in real-time.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Language**: JavaScript (100%)
- **API Architecture**: REST APIs
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Execution**: Code execution engine
- **Deployment**: Render/Heroku

## ✨ Key Features

- ⚡ **Sub-200ms Response Time**: Consistent API responses under load
- 👥 **200+ Concurrent Users**: Tested and optimized for high concurrency
- 🚀 **35% Performance Optimization**: Query optimization and strategic indexing
- 💾 **Robust Database**: PostgreSQL with connection pooling
- 🔐 **JWT Authentication**: Secure token-based authentication
- 📊 **Real-Time Code Execution**: Execute code instantly
- 🗄️ **Connection Pooling**: Efficient resource management
- 📈 **Scalable Architecture**: Built for growth and high traffic
- 🔄 **API-Contract-First**: Parallel frontend-backend development

## 🌐 Live Demo

Explore the CodeFunda platform: **Note : Piston server requires subscription to deploy the live link will be available soon.**

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/sandeep2811-dev/CodeFunda_Backend.git

# Navigate to the project directory
cd CodeFunda_Backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Configuration

Update `.env` with your configuration:
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/codefunda
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### Running the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📊 Performance Highlights

- **API Response Time**: Sub-200ms average response time
- **Data Retrieval Optimization**: 35% improvement through query optimization
- **Concurrent User Support**: Tested for 200+ simultaneous users
- **Connection Management**: Efficient pooling for consistent performance
- **Database Optimization**: Strategic indexing on frequently queried fields

## 📁 Project Structure

```
CodeFunda_Backend/
├── src/
│   ├── routes/                     # API route definitions
│   │   ├── problems.js             # Problem endpoints
│   │   ├── submissions.js          # Submission endpoints
│   │   ├── users.js                # User endpoints
│   │   └── auth.js                 # Authentication endpoints
│   ├── controllers/                # Business logic
│   │   ├── problemController.js
│   │   ├── submissionController.js
│   │   ├── userController.js
│   │   └── authController.js
│   ├── models/                     # Database models
│   │   ├── Problem.js
│   │   ├── Submission.js
│   │   ├── User.js
│   │   └── TestCase.js
│   ├── middleware/                 # Custom middleware
│   │   ├── auth.js                 # Authentication middleware
│   │   ├── validation.js           # Input validation
│   │   └── errorHandler.js         # Error handling
│   ├── utils/                      # Utility functions
│   │   ├── codeExecutor.js         # Code execution engine
│   │   ├── database.js             # Database connection
│   │   └── helpers.js              # Helper functions
│   ├── config/                     # Configuration files
│   └── app.js                      # Express app setup
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies
├── server.js                       # Entry point
└── README.md                       # This file
```

## 🔄 Core API Endpoints

### Authentication
```
POST   /api/auth/register           - User registration
POST   /api/auth/login              - User login
POST   /api/auth/logout             - User logout
POST   /api/auth/refresh-token      - Refresh JWT token
```

### Coding Problems
```
GET    /api/problems                - Get all problems
GET    /api/problems/:id            - Get specific problem
POST   /api/problems                - Create new problem (admin)
PUT    /api/problems/:id            - Update problem
DELETE /api/problems/:id            - Delete problem
```

### Code Submission & Execution
```
POST   /api/submissions             - Submit code for execution
GET    /api/submissions/:id         - Get submission details
GET    /api/submissions/user/:userId - Get user submissions
PUT    /api/submissions/:id         - Update submission
DELETE /api/submissions/:id         - Delete submission
```

### User Management
```
GET    /api/users/:id               - Get user profile
PUT    /api/users/:id               - Update profile
GET    /api/users/:id/submissions   - Get user submissions
GET    /api/users/:id/stats         - Get user statistics
```

## 🔐 Authentication & Security

### JWT Token Structure
```
Header: Authorization: Bearer <jwt_token>
```

### Security Features
- Password hashing with bcrypt
- JWT token-based authentication
- CORS enabled for frontend communication
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- SQL injection prevention

## 📊 Database Architecture

### Core Tables

**Users Table**
```sql
- id (Primary Key)
- username (Unique)
- email (Unique)
- passwordHash
- profile_picture
- created_at
- updated_at
```

**Problems Table**
```sql
- id (Primary Key)
- title
- description
- difficulty (Easy/Medium/Hard)
- category
- starter_code
- test_cases_count
- created_at
- updated_at
```

**Submissions Table**
```sql
- id (Primary Key)
- user_id (Foreign Key)
- problem_id (Foreign Key)
- code
- language
- status (Pending/Accepted/Wrong Answer/Runtime Error)
- execution_time
- memory_used
- submitted_at
```

**TestCases Table**
```sql
- id (Primary Key)
- problem_id (Foreign Key)
- input
- expected_output
- is_hidden
- created_at
```

## 🧪 Code Execution Engine

### Supported Languages
- JavaScript/Node.js
- Python
- Java
- C++
- C

### Execution Flow
```
1. Receive code submission
2. Validate code syntax
3. Compile (if required)
4. Run test cases
5. Compare output
6. Generate results
7. Store submission
```

## 📈 Performance Optimization Techniques

### Database Optimization
- Strategic indexing on frequently queried columns
- Connection pooling for efficient resource management
- Query optimization through JOIN optimization
- Pagination for large result sets
- Caching frequently accessed data

### API Optimization
- Gzip compression for responses
- Response caching headers
- Efficient JSON serialization
- Middleware optimization
- Async/await for non-blocking operations

### Code Execution Optimization
- Sandbox environment for safe execution
- Resource limits (CPU, memory, timeout)
- Efficient test case validation
- Parallel execution support

## 🚀 Deployment

### Deploy to Render
```bash
# Push to GitHub
git push origin main

# Render automatically deploys from GitHub
# Your API will be live at: https://codefunda-backend.onrender.com/
```

### Deploy to Heroku
```bash
heroku login
heroku create codefunda-backend
git push heroku main
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/problems.test.js
```

## 📝 Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/codefunda
DB_POOL_SIZE=20
DB_POOL_TIMEOUT=30000

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRE=7d

# Code Execution
CODE_EXECUTION_TIMEOUT=5000
MEMORY_LIMIT=256
```

## 🛣️ Future Enhancements

- [ ] WebSocket support for real-time collaboration
- [ ] Advanced code debugging tools
- [ ] AI-powered solution suggestions
- [ ] Contest/competition mode
- [ ] Leaderboard system
- [ ] Achievement badges
- [ ] Code review features
- [ ] Problem difficulty rating system
- [ ] Custom test case support
- [ ] Performance analytics dashboard

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Sandeep Pullareddy**
- GitHub: [@sandeep2811-dev](https://github.com/sandeep2811-dev)

## 📞 Support

For support and inquiries, please open an issue on the GitHub repository.

---

**Built with ❤️ for coding enthusiasts | Performance-optimized backend for competitive coding**
