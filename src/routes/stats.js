const express = require('express');

const router = express.Router();

// Get library statistics
router.get('/', async (req, res) => {
  try {
    // Update overdue status before calculating stats
    await req.prisma.borrowRecord.updateMany({
      where: {
        status: 'borrowed',
        dueDate: { lt: new Date() },
      },
      data: { status: 'overdue' },
    });

    const [bookStats, studentCount, borrowStats, categoryStats, overdueStats] =
      await Promise.all([
        req.prisma.book.aggregate({
          _sum: {
            totalCopies: true,
            availableCopies: true,
          },
          _count: true,
        }),
        req.prisma.student.count(),
        req.prisma.borrowRecord.groupBy({
          by: ['status'],
          _count: true,
        }),
        req.prisma.book.groupBy({
          by: ['category'],
          _count: true,
          _sum: {
            totalCopies: true,
            availableCopies: true,
          },
        }),
        req.prisma.borrowRecord.aggregate({
          where: { status: 'overdue' },
          _count: true,
          _sum: { fineAmount: true },
        }),
      ]);

    const totalBooks = bookStats._sum.totalCopies || 0;
    const availableBooks = bookStats._sum.availableCopies || 0;
    const borrowedBooks = totalBooks - availableBooks;

    const borrowStatusMap = borrowStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        books: {
          total: totalBooks,
          available: availableBooks,
          borrowed: borrowedBooks,
          uniqueTitles: bookStats._count,
        },
        students: {
          total: studentCount,
        },
        borrowing: {
          active: borrowStatusMap.borrowed || 0,
          returned: borrowStatusMap.returned || 0,
          overdue: borrowStatusMap.overdue || 0,
        },
        categories: categoryStats.map((cat) => ({
          name: cat.category,
          totalBooks: cat._sum.totalCopies,
          availableBooks: cat._sum.availableCopies,
          bookCount: cat._count,
        })),
        fines: {
          totalOverdueBooks: overdueStats._count || 0,
          totalFineAmount: parseFloat(
            (overdueStats._sum.fineAmount || 0).toFixed(2)
          ),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

module.exports = router;
