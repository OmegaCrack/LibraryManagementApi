const express = require('express');
const { validateBorrow, validateReturn } = require('../validators/borrow');

const router = express.Router();

// Helper function to calculate due date
const calculateDueDate = (borrowDate, daysToAdd = 14) => {
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + daysToAdd);
  return dueDate;
};

// Helper function to calculate fine
const calculateFine = (dueDate, returnDate = new Date()) => {
  const diffTime = returnDate - dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * 2 : 0; // $2 per day fine
};

// Borrow a book
router.post('/checkout', async (req, res) => {
  try {
    const { error, value } = validateBorrow(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }

    const { studentId, bookId } = value;

    // Use transaction to ensure data consistency
    const result = await req.prisma.$transaction(async (prisma) => {
      const [student, book] = await Promise.all([
        prisma.student.findUnique({ where: { id: studentId } }),
        prisma.book.findUnique({ where: { id: bookId } }),
      ]);

      if (!student) {
        throw new Error('Student not found');
      }

      if (!book) {
        throw new Error('Book not found');
      }

      if (book.availableCopies <= 0) {
        throw new Error('Book is not available for borrowing');
      }

      if (student.currentBooksCount >= student.maxBooksAllowed) {
        throw new Error('Student has reached maximum borrowing limit');
      }

      // Check if student already has this book
      const existingBorrow = await prisma.borrowRecord.findFirst({
        where: {
          studentId,
          bookId,
          status: { in: ['borrowed', 'overdue'] },
        },
      });

      if (existingBorrow) {
        throw new Error('Student already has this book borrowed');
      }

      const borrowDate = new Date();
      const dueDate = calculateDueDate(borrowDate);

      // Create borrow record
      const borrowRecord = await prisma.borrowRecord.create({
        data: {
          studentId,
          bookId,
          borrowDate,
          dueDate,
          status: 'borrowed',
        },
        include: {
          book: { select: { title: true, author: true } },
          student: { select: { name: true, studentId: true } },
        },
      });

      // Update book and student counts
      await Promise.all([
        prisma.book.update({
          where: { id: bookId },
          data: { availableCopies: { decrement: 1 } },
        }),
        prisma.student.update({
          where: { id: studentId },
          data: { currentBooksCount: { increment: 1 } },
        }),
      ]);

      return borrowRecord;
    });

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Return a book
router.post('/return', async (req, res) => {
  try {
    const { error, value } = validateReturn(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }

    const { borrowId } = value;

    const result = await req.prisma.$transaction(async (prisma) => {
      const borrowRecord = await prisma.borrowRecord.findUnique({
        where: { id: borrowId },
        include: {
          book: { select: { title: true, author: true } },
          student: { select: { name: true, studentId: true } },
        },
      });

      if (!borrowRecord) {
        throw new Error('Borrow record not found');
      }

      if (borrowRecord.status === 'returned') {
        throw new Error('Book has already been returned');
      }

      const returnDate = new Date();
      const fine = calculateFine(borrowRecord.dueDate, returnDate);

      // Update borrow record
      const updatedRecord = await prisma.borrowRecord.update({
        where: { id: borrowId },
        data: {
          returnDate,
          status: 'returned',
          fineAmount: fine,
        },
        include: {
          book: { select: { title: true, author: true } },
          student: { select: { name: true, studentId: true } },
        },
      });

      // Update book and student counts
      await Promise.all([
        prisma.book.update({
          where: { id: borrowRecord.bookId },
          data: { availableCopies: { increment: 1 } },
        }),
        prisma.student.update({
          where: { id: borrowRecord.studentId },
          data: { currentBooksCount: { decrement: 1 } },
        }),
      ]);

      return updatedRecord;
    });

    res.json({
      success: true,
      message: 'Book returned successfully',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get borrowing records
router.get('/records', async (req, res) => {
  try {
    const { page = 1, limit = 10, studentId, bookId, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (studentId) where.studentId = parseInt(studentId);
    if (bookId) where.bookId = parseInt(bookId);
    if (status) where.status = status;

    // Update overdue status before fetching
    await req.prisma.borrowRecord.updateMany({
      where: {
        status: 'borrowed',
        dueDate: { lt: new Date() },
      },
      data: { status: 'overdue' },
    });

    const [records, total] = await Promise.all([
      req.prisma.borrowRecord.findMany({
        where,
        skip,
        take,
        include: {
          book: { select: { title: true, author: true, isbn: true } },
          student: { select: { name: true, studentId: true, email: true } },
        },
        orderBy: { borrowDate: 'desc' },
      }),
      req.prisma.borrowRecord.count({ where }),
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch borrow records',
      error: error.message,
    });
  }
});

// Get overdue books
router.get('/overdue', async (req, res) => {
  try {
    // Update overdue status
    await req.prisma.borrowRecord.updateMany({
      where: {
        status: 'borrowed',
        dueDate: { lt: new Date() },
      },
      data: { status: 'overdue' },
    });

    const overdueRecords = await req.prisma.borrowRecord.findMany({
      where: { status: 'overdue' },
      include: {
        book: { select: { title: true, author: true, isbn: true } },
        student: { select: { name: true, studentId: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Calculate days overdue and update fines
    const today = new Date();
    const enrichedRecords = overdueRecords.map((record) => {
      const daysOverdue = Math.ceil(
        (today - record.dueDate) / (1000 * 60 * 60 * 24)
      );
      const fine = calculateFine(record.dueDate, today);

      return {
        ...record,
        daysOverdue,
        calculatedFine: fine,
      };
    });

    res.json({
      success: true,
      data: enrichedRecords,
      total: enrichedRecords.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue records',
      error: error.message,
    });
  }
});

module.exports = router;
