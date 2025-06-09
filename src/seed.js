const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await prisma.borrowRecord.deleteMany();
    await prisma.book.deleteMany();
    await prisma.student.deleteMany();

    // Seed books
    const books = await prisma.book.createMany({
      data: [
        {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          isbn: '978-0-7432-7356-5',
          category: 'Fiction',
          totalCopies: 5,
          availableCopies: 5,
        },
        {
          title: 'To Kill a Mockingbird',
          author: 'Harper Lee',
          isbn: '978-0-06-112008-4',
          category: 'Fiction',
          totalCopies: 3,
          availableCopies: 3,
        },
        {
          title: '1984',
          author: 'George Orwell',
          isbn: '978-0-452-28423-4',
          category: 'Dystopian Fiction',
          totalCopies: 4,
          availableCopies: 4,
        },
        {
          title: 'Pride and Prejudice',
          author: 'Jane Austen',
          isbn: '978-0-14-143951-8',
          category: 'Romance',
          totalCopies: 2,
          availableCopies: 2,
        },
        {
          title: 'The Catcher in the Rye',
          author: 'J.D. Salinger',
          isbn: '978-0-316-76948-0',
          category: 'Fiction',
          totalCopies: 3,
          availableCopies: 3,
        },
        {
          title: 'Lord of the Flies',
          author: 'William Golding',
          isbn: '978-0-571-05686-2',
          category: 'Fiction',
          totalCopies: 4,
          availableCopies: 4,
        },
        {
          title: 'The Lord of the Rings',
          author: 'J.R.R. Tolkien',
          isbn: '978-0-544-00341-5',
          category: 'Fantasy',
          totalCopies: 6,
          availableCopies: 6,
        },
        {
          title: "Harry Potter and the Philosopher's Stone",
          author: 'J.K. Rowling',
          isbn: '978-0-7475-3269-9',
          category: 'Fantasy',
          totalCopies: 8,
          availableCopies: 8,
        },
        {
          title: 'Introduction to Algorithms',
          author: 'Thomas H. Cormen',
          isbn: '978-0-262-03384-8',
          category: 'Computer Science',
          totalCopies: 3,
          availableCopies: 3,
        },
        {
          title: 'Clean Code',
          author: 'Robert C. Martin',
          isbn: '978-0-13-235088-4',
          category: 'Computer Science',
          totalCopies: 2,
          availableCopies: 2,
        },
      ],
    });

    // Seed students
    const students = await prisma.student.createMany({
      data: [
        {
          name: 'John Doe',
          email: 'john.doe@university.edu',
          studentId: 'STU001',
          maxBooksAllowed: 5,
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@university.edu',
          studentId: 'STU002',
          maxBooksAllowed: 5,
        },
        {
          name: 'Mike Johnson',
          email: 'mike.johnson@university.edu',
          studentId: 'STU003',
          maxBooksAllowed: 3,
        },
        {
          name: 'Sarah Wilson',
          email: 'sarah.wilson@university.edu',
          studentId: 'STU004',
          maxBooksAllowed: 5,
        },
        {
          name: 'David Brown',
          email: 'david.brown@university.edu',
          studentId: 'STU005',
          maxBooksAllowed: 4,
        },
      ],
    });

    console.log(`✅ Created ${books.count} books`);
    console.log(`✅ Created ${students.count} students`);

    // Create some sample borrow records
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const pastBorrowDate = new Date();
    pastBorrowDate.setDate(pastBorrowDate.getDate() - 20);
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 6);

    await prisma.borrowRecord.createMany({
      data: [
        {
          studentId: 1,
          bookId: 1,
          borrowDate: pastBorrowDate,
          dueDate: pastDueDate,
          status: 'overdue',
          fineAmount: 12.0,
        },
        {
          studentId: 2,
          bookId: 2,
          borrowDate: borrowDate,
          dueDate: dueDate,
          status: 'borrowed',
          fineAmount: 0,
        },
      ],
    });

    // Update book availability and student counts
    await prisma.book.update({
      where: { id: 1 },
      data: { availableCopies: 4 },
    });

    await prisma.book.update({
      where: { id: 2 },
      data: { availableCopies: 2 },
    });

    await prisma.student.update({
      where: { id: 1 },
      data: { currentBooksCount: 1 },
    });

    await prisma.student.update({
      where: { id: 2 },
      data: { currentBooksCount: 1 },
    });

    console.log('✅ Created sample borrow records');
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run seed if called directly
if (require.main === module) {
  seedData().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = seedData;
