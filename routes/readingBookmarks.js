const express = require("express");

const ReadingBookmark = require("../models/ReadingBookmark");
const Book = require("../models/Book");
const userAuth = require("../middleware/userAuth");

const router = express.Router();


// ===============================
// GET ALL READING BOOKMARKS
// ===============================

router.get("/", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    const bookmarks = await ReadingBookmark.findAll({
      where: {
        UserId: userId,
      },
      include: [
        {
          model: Book,
        },
      ],
      order: [["updated_at", "DESC"]],
    });

    return res.status(200).json(bookmarks);

  } catch (error) {
    console.error("❌ Reading bookmarks GET error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reading bookmarks",
      error: error.message,
    });
  }
});


// ===============================
// GET BOOKMARK FOR ONE BOOK
// ===============================

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

    const bookmark = await ReadingBookmark.findOne({
      where: {
        UserId: userId,
        BookId: bookId,
      },
      include: [
        {
          model: Book,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      bookmarked: !!bookmark,
      bookmark,
    });

  } catch (error) {
    console.error("❌ Reading bookmark check error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check bookmark",
      error: error.message,
    });
  }
});


// ===============================
// CREATE / UPDATE BOOKMARK
// ===============================

router.post("/", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const {
      book_id,
      page_number,
      page_text,
    } = req.body;

    const bookId = Number(book_id);
    const pageNumber = Number(page_number);

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

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
  return res.status(400).json({
    success: false,
    message: "Valid page_number is required",
  });
}

    const book = await Book.findByPk(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    let bookmark = await ReadingBookmark.findOne({
      where: {
        UserId: userId,
        BookId: bookId,
      },
    });

    if (bookmark) {
      bookmark.page_number = pageNumber;
      bookmark.page_text =
        page_text
          ? String(page_text).trim()
          : null;
      bookmark.updated_at = new Date();

      await bookmark.save();

      return res.status(200).json({
        success: true,
        message: "Bookmark updated successfully",
        bookmark,
      });
    }

    bookmark = await ReadingBookmark.create({
      UserId: userId,
      BookId: bookId,
      page_number: pageNumber,
      page_text:
        page_text
          ? String(page_text).trim()
          : null,
    });

    return res.status(201).json({
      success: true,
      message: "Bookmark saved successfully",
      bookmark,
    });

  } catch (error) {
    console.error("❌ Reading bookmark POST error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save bookmark",
      error: error.message,
    });
  }
});


// ===============================
// DELETE BOOKMARK
// ===============================

router.delete("/:bookId", userAuth, async (req, res) => {
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

    const bookmark = await ReadingBookmark.findOne({
      where: {
        UserId: userId,
        BookId: bookId,
      },
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: "Reading bookmark not found",
      });
    }

    await bookmark.destroy();

    return res.status(200).json({
      success: true,
      message: "Bookmark removed successfully",
    });

  } catch (error) {
    console.error("❌ Reading bookmark DELETE error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove bookmark",
      error: error.message,
    });
  }
});


module.exports = router;