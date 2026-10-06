const express = require("express");

const Highlight = require("../models/Highlight");
const Book = require("../models/Book");
const userAuth = require("../middleware/userAuth");

const router = express.Router();


// ========================================
// GET USER HIGHLIGHTS
// GET /highlights
// ========================================
router.get("/", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    console.log("🔥 GET /highlights");
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    const highlights = await Highlight.findAll({
      where: {
        UserId: userId,
      },

      include: [
        {
          model: Book,
        },
      ],

      order: [["created_at", "DESC"]],
    });

    console.log(
      "🖍️ Highlights found:",
      highlights.length
    );

    return res.status(200).json(highlights);

  } catch (error) {
    console.error(
      "❌ Highlights GET Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch highlights",
      error: error.message,
    });
  }
});


// ========================================
// ADD HIGHLIGHT
// POST /highlights
// ========================================
router.post("/", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const {
      book_id,
      highlighted_text,
      page_number,
    } = req.body;

    const bookId = Number(book_id);

    console.log("🔥 POST /highlights");
    console.log("User ID:", userId);
    console.log("Book ID:", bookId);
    console.log("Text:", highlighted_text);

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

    if (
      !highlighted_text ||
      !String(highlighted_text).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "highlighted_text is required",
      });
    }

    const book = await Book.findByPk(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const highlight = await Highlight.create({
      UserId: userId,
      BookId: bookId,
      highlighted_text:
        String(highlighted_text).trim(),
      page_number:
        page_number !== undefined &&
        page_number !== null &&
        page_number !== ""
          ? Number(page_number)
          : null,
    });

    console.log(
      "✅ Highlight created:",
      highlight.toJSON()
    );

    return res.status(201).json({
      success: true,
      message: "Highlight saved successfully",
      highlight,
    });

  } catch (error) {
    console.error(
      "❌ Highlights POST Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save highlight",
      error: error.message,
    });
  }
});


// ========================================
// DELETE HIGHLIGHT
// DELETE /highlights/:id
// ========================================
router.delete("/:id", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const highlightId = Number(req.params.id);

    console.log("🔥 DELETE /highlights/:id");
    console.log("User ID:", userId);
    console.log("Highlight ID:", highlightId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    if (!highlightId) {
      return res.status(400).json({
        success: false,
        message: "Invalid highlight ID",
      });
    }

    const highlight = await Highlight.findOne({
      where: {
        id: highlightId,
        UserId: userId,
      },
    });

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: "Highlight not found",
      });
    }

    await highlight.destroy();

    console.log("✅ Highlight deleted");

    return res.status(200).json({
      success: true,
      message: "Highlight deleted successfully",
    });

  } catch (error) {
    console.error(
      "❌ Highlights DELETE Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete highlight",
      error: error.message,
    });
  }
});


module.exports = router;