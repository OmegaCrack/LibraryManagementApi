# Library Management API

A comprehensive library management system built with Express.js, PostgreSQL, and Prisma ORM. This API provides complete functionality for managing books, students, borrowing records, and library analytics.

## Features

### 📚 Book Management
- Add, update, delete, and search books
- Track inventory with total and available copies
- ISBN validation and duplicate prevention
- Category-based organization
- Pagination and filtering support

### 👥 Student Management
- Student registration and profile management
- Configurable borrowing limits
- Track current borrowed books
- Complete borrowing history

### 📖 Borrowing System
- Check out books with automatic due date calculation
- Return books with fine calculation
- Prevent duplicate borrowing
- Automatic overdue detection
- Transaction-based operations for data consistency

### 📊 Analytics & Reporting
- Real-time library statistics
- Overdue book tracking
- Fine calculation and management
- Category-wise book distribution
- Borrowing trends and patterns

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Joi
- **Containerization**: Docker & Docker Compose
- **Additional**: Helmet, CORS, Rate Limiting, Morgan

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone and setup**:
```bash
git clone <repository-url>
cd library-management-api
```

2. **Start the application**:
```bash
docker-compose up -d
```

3. **Access the services**:
   - API: http://localhost:3000
   - Database Admin (Adminer): http://localhost:8080
   - Health Check: http://localhost:3000/health

### Manual Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Setup PostgreSQL database**:
```bash
# Create database
createdb library_db
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Run database migrations**:
```bash
npm run db:migrate
npm run db:generate
npm run db:seed
```

5. **Start the server**:
```bash
npm run dev
```

## API Endpoints

### Books
- `GET /api/books` - Get all books (with pagination & filters)
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Add new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student with borrowing history
- `POST /api/students` - Register new student

### Borrowing
- `POST /api/borrow/checkout` - Borrow a book
- `POST /api/borrow/return` - Return a book
- `GET /api/borrow/records` - Get all borrowing records
- `GET /api/borrow/overdue` - Get overdue books

### Analytics
- `GET /api/stats` - Get library statistics

## API Usage Examples

### Add a Book
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0-7432-7356-5",
    "category": "Fiction",
    "totalCopies": 5
  }'
```

### Register a Student
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@university.edu",
    "studentId": "STU001",
    "maxBooksAllowed": 5
  }'
```

### Borrow a Book
```bash
curl -X POST http://localhost:3000/api/borrow/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "bookId": 1
  }'
```

### Return a Book
```bash
curl -X POST http://localhost:3000/api/borrow/return \
  -H "Content-Type: application/json" \
  -d '{
    "borrowId": 1
  }'
```

## Database Schema

### Books
- `id`: Primary key
- `title`: Book title
- `author`: Book author
- `isbn`: Unique ISBN (validated)
- `category`: Book category
- `totalCopies`: Total number of copies
- `availableCopies`: Available copies for borrowing

### Students
- `id`: Primary key
- `name`: Student name
- `email`: Unique email address
- `studentId`: Unique student identifier
- `maxBooksAllowed`: Maximum books that can be borrowed
- `currentBooksCount`: Currently borrowed books count

### Borrow Records
- `id`: Primary key
- `studentId`: Foreign key to students
- `bookId`: Foreign key to books
- `borrowDate`: Date when book was borrowed
- `dueDate`: Due date for return
- `returnDate`: Actual return date (nullable)
- `status`: Current status (borrowed, returned, overdue)
- `fineAmount`: Fine amount for overdue books

## Configuration

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/library_db"
NODE_ENV="development"
PORT=3000
JWT_SECRET="your-jwt-secret-key"
```

### Docker Compose Configuration
The `docker-compose.yml` file includes:
- PostgreSQL database with persistent volume
- Node.js API server
- Adminer for database management
- Network configuration for service communication

## Development

### Database Operations
```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed database with sample data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Production Deployment

1. **Environment Setup**:
   - Set `NODE_ENV=production`
   - Configure proper database credentials
   - Set up proper logging and monitoring

2. **Security Considerations**:
   - Enable HTTPS
   - Configure proper CORS settings
   - Set up rate limiting
   - Enable request logging

3. **Performance Optimization**:
   - Database indexing
   - Connection pooling
   - Caching strategies
   - Load balancing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation
- Review the troubleshooting guide
