const express = require("express");

const Testimonial = require("../models/Testimonial");
const Book = require("../models/Book");
const userAuth = require("../middleware/userAuth");

const router = express.Router();

// GET reviews
router.get("/book/:bookId", async (req, res) => {
  try {
    const bookId = Number(req.params.bookId);

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const reviews = await Testimonial.findAll({
      where: { BookId: bookId },
      order: [["id", "DESC"]],
    });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("❌ Get reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
});

// POST review
router.post("/", userAuth, async (req, res) => {
  try {
    console.log("🔥 POST /reviews");
    console.log("User:", req.user);
    console.log("Body:", req.body);

    const { book_id, rating, review } = req.body;

    if (!book_id || !rating || !review) {
      return res.status(400).json({
        success: false,
        message: "book_id, rating and review are required",
      });
    }

    const bookId = Number(book_id);
    const numericRating = Number(rating);

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const book = await Book.findByPk(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const userName =
      req.user.name ||
      req.user.email ||
      "Book Reader";

    const newReview = await Testimonial.create({
      name: userName,
      review: String(review).trim(),
      rating: numericRating,
      BookId: bookId,
    });

    console.log("✅ Review created:", newReview.toJSON());

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: newReview,
    });

  } catch (error) {
    console.error("❌ Submit review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
});

module.exports = router;