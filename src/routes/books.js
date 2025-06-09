const express = require('express');
const { validateBook, validateBookUpdate } = require('../validators/book');

const router = express.Router();

// Get all books with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      author,
      title,
      available,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (author) {
      where.author = { contains: author, mode: 'insensitive' };
    }

    if (title) {
      where.title = { contains: title, mode: 'insensitive' };
    }

    if (available === 'true') {
      where.availableCopies = { gt: 0 };
    }

    const [books, total] = await Promise.all([
      req.prisma.book.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      req.prisma.book.count({ where }),
    ]);

    res.json({
      success: true,
      data: books,
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
      message: 'Failed to fetch books',
      error: error.message,
    });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await req.prisma.book.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        borrowRecords: {
          include: {
            student: {
              select: { name: true, studentId: true },
            },
          },
          orderBy: { borrowDate: 'desc' },
        },
      },
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch book',
      error: error.message,
    });
  }
});

// Add new book
router.post('/', async (req, res) => {
  try {
    const { error, value } = validateBook(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }

    const { title, author, isbn, category, totalCopies } = value;

    const book = await req.prisma.book.create({
      data: {
        title,
        author,
        isbn,
        category,
        totalCopies,
        availableCopies: totalCopies,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: book,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Book with this ISBN already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add book',
      error: error.message,
    });
  }
});

// Update book
router.put('/:id', async (req, res) => {
  try {
    const { error, value } = validateBookUpdate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }

    const bookId = parseInt(req.params.id);
    const existingBook = await req.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const updateData = { ...value };

    // Update available copies if total copies changed
    if (value.totalCopies && value.totalCopies !== existingBook.totalCopies) {
      const difference = value.totalCopies - existingBook.totalCopies;
      updateData.availableCopies = existingBook.availableCopies + difference;
    }

    const book = await req.prisma.book.update({
      where: { id: bookId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: book,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update book',
      error: error.message,
    });
  }
});

// Delete book
router.delete('/:id', async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);

    // Check if book has active borrows
    const activeBorrows = await req.prisma.borrowRecord.count({
      where: {
        bookId,
        status: { in: ['borrowed', 'overdue'] },
      },
    });

    if (activeBorrows > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete book that is currently borrowed',
      });
    }

    await req.prisma.book.delete({
      where: { id: bookId },
    });

    res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete book',
      error: error.message,
    });
  }
});

module.exports = router;
