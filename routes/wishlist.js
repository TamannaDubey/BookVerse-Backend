
const express = require("express");
const router = express.Router();

const Wishlist = require("../models/Wishlist");
const Book = require("../models/Book");
const userAuth = require("../middleware/userAuth");

// ========================================
// GET USER WISHLIST
// GET /wishlist
// ========================================
router.get("/", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    const wishlist = await Wishlist.findAll({
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

    return res.status(200).json(wishlist);
  } catch (error) {
    console.error("❌ Wishlist GET Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
});


// ========================================
// ADD BOOK TO WISHLIST
// POST /wishlist
// ========================================
router.post("/", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const bookId = Number(req.body.book_id);

    console.log("🔥 POST /wishlist");
    console.log("User ID:", userId);
    console.log("Book ID:", bookId);

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

    // Check book
    const book = await Book.findByPk(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check duplicate
    const existingWishlist = await Wishlist.findOne({
      where: {
        UserId: userId,
        BookId: bookId,
      },
    });

    if (existingWishlist) {
      return res.status(409).json({
        success: false,
        message: "Book already exists in wishlist",
        wishlist: existingWishlist,
      });
    }

    // Create wishlist
    const wishlist = await Wishlist.create({
      UserId: userId,
      BookId: bookId,
    });

    console.log("✅ Book added to wishlist");

    return res.status(201).json({
      success: true,
      message: "Book added to wishlist",
      wishlist,
    });

  } catch (error) {
    console.error("❌ Wishlist POST Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add book to wishlist",
      error: error.message,
    });
  }
});


// ========================================
// REMOVE BOOK FROM WISHLIST
// DELETE /wishlist/:bookId
// ========================================
router.delete("/:bookId", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const bookId = Number(req.params.bookId);

    console.log("🔥 DELETE /wishlist/:bookId");
    console.log("User ID:", userId);
    console.log("Book ID:", bookId);

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

    const wishlist = await Wishlist.findOne({
      where: {
        UserId: userId,
        BookId: bookId,
      },
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Book not found in wishlist",
      });
    }

    await wishlist.destroy();

    console.log("✅ Book removed from wishlist");

    return res.status(200).json({
      success: true,
      message: "Book removed from wishlist",
    });

  } catch (error) {
    console.error("❌ Wishlist DELETE Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove book from wishlist",
      error: error.message,
    });
  }
});


// ========================================
// CHECK BOOKMARK STATUS
// GET /wishlist/check/:bookId
// ========================================
router.get("/check/:bookId", userAuth, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const bookId = Number(req.params.bookId);

    console.log("🔥 GET /wishlist/check/:bookId");
    console.log("User ID:", userId);
    console.log("Book ID:", bookId);

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

    const wishlist = await Wishlist.findOne({
      where: {
        UserId: userId,
        BookId: bookId,
      },
    });

    return res.status(200).json({
      success: true,
      inWishlist: !!wishlist,
    });

  } catch (error) {
    console.error("❌ Wishlist Check Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check wishlist",
      error: error.message,
    });
  }
});


module.exports = router;
