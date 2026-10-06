const express = require("express");

const ReadingHistory = require("../models/ReadingHistory");
const Book = require("../models/Book");
const userAuth = require("../middleware/userAuth");

const router = express.Router();


// =====================================
// GET USER READING HISTORY
// =====================================

router.get("/", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    const history = await ReadingHistory.findAll({
      where: {
        UserId: userId,
      },
      include: [
        {
          model: Book,
        },
      ],
      order: [["last_read_at", "DESC"]],
    });

    return res.status(200).json(history);

  } catch (error) {
    console.error("❌ Reading history GET error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reading history",
      error: error.message,
    });
  }
});


// =====================================
// GET HISTORY FOR ONE BOOK
// =====================================

router.get("/:bookId", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const bookId = Number(req.params.bookId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const history = await ReadingHistory.findOne({
      where: {
        UserId: userId,
        BookId: bookId,
      },
    });

    return res.status(200).json({
      success: true,
      history,
    });

  } catch (error) {
    console.error("❌ Book reading history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch book reading history",
      error: error.message,
    });
  }
});


// =====================================
// SAVE / UPDATE READING PROGRESS
// =====================================

router.post("/", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const {
      book_id,
      current_page,
      total_pages,
    } = req.body;

    const bookId = Number(book_id);
    const currentPage = Number(current_page);
    const totalPages = Number(total_pages);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "book_id is required",
      });
    }

    if (!Number.isInteger(currentPage) || currentPage < 1) {
  return res.status(400).json({
    success: false,
    message: "Valid current_page is required",
  });
}

    if (!Number.isInteger(totalPages) || totalPages < 1) {
  return res.status(400).json({
    success: false,
    message: "Valid total_pages is required",
  });
}

    const book = await Book.findByPk(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const safeCurrentPage = Math.min(
      currentPage,
      totalPages
    );

    const progress = Number(
      (
        (safeCurrentPage / totalPages) *
        100
      ).toFixed(2)
    );

    let history = await ReadingHistory.findOne({
      where: {
        UserId: userId,
        BookId: bookId,
      },
    });

    if (history) {
      history.current_page = safeCurrentPage;
      history.total_pages = totalPages;
      history.progress = progress;
      history.last_read_at = new Date();

      await history.save();

    } else {
      history = await ReadingHistory.create({
        UserId: userId,
        BookId: bookId,
        current_page: safeCurrentPage,
        total_pages: totalPages,
        progress,
        last_read_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reading progress saved",
      history,
    });

  } catch (error) {
    console.error("❌ Reading progress POST error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save reading progress",
      error: error.message,
    });
  }
});


module.exports = router;