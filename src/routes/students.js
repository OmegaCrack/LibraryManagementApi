const express = require('express');
const { validateStudent } = require('../validators/student');

const router = express.Router();

// Get all students
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [students, total] = await Promise.all([
      req.prisma.student.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.student.count()
    ]);

    res.json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await req.prisma.student.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        borrowRecords: {
          include: {
            book: {
              select: { title: true, author: true, isbn: true }
            }
          },
          orderBy: { borrowDate: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error.message
    });
  }
});

// Register new student
router.post('/', async (req, res) => {
  try {
    const { error, value } = validateStudent(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(d => d.message)
      });
    }

    const student = await req.prisma.student.create({
      data: value
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: student
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Student with this email or student ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register student',
      error: error.message
    });
  }
});

module.exports = router;