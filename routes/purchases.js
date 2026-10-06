const express = require("express");

const Purchase = require("../models/Purchase");
const Book = require("../models/Book");
const User = require("../models/User");

const userAuth = require("../middleware/userAuth");

const router = express.Router();

console.log("✅ purchases.js ROUTE FILE LOADED");

/*
====================================================
GET USER PURCHASES
GET /purchases
====================================================
*/

router.get("/", userAuth, async (req, res) => {
  console.log("🔥 /purchases GET called");
  console.log("Authenticated User ID:", req.user.id);

  try {
    const userId = Number(req.user.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user",
      });
    }

    const purchases = await Purchase.findAll({
      where: {
        UserId: userId,
      },
      include: [
        {
          model: Book,
        },
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["purchased_at", "DESC"]],
    });

    console.log("Purchases found:", purchases.length);

    return res.status(200).json(purchases);

  } catch (error) {
    console.error("❌ Purchase GET error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
});


/*
====================================================
CREATE PURCHASE
POST /purchases
====================================================
*/

router.post("/", userAuth, async (req, res) => {
  console.log("🔥 /purchases POST called");
  console.log("Authenticated User ID:", req.user.id);
  console.log("Body:", req.body);

  try {
    const { book_id, payment_id } = req.body;

    /*
    --------------------------------------------
    Validation
    --------------------------------------------
    */

    if (!book_id || !payment_id) {
      return res.status(400).json({
        success: false,
        message: "book_id and payment_id are required",
      });
    }

    const userId = Number(req.user.id);
    const bookId = Number(book_id);

    if (!userId || !bookId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user or book",
      });
    }

    /*
    --------------------------------------------
    Check User
    --------------------------------------------
    */

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /*
    --------------------------------------------
    Check Book
    --------------------------------------------
    */

    const book = await Book.findByPk(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    /*
    --------------------------------------------
    Prevent Duplicate Purchase
    --------------------------------------------
    */

    const existingPurchase = await Purchase.findOne({
      where: {
        UserId: userId,
        BookId: bookId,
      },
    });

    if (existingPurchase) {
      return res.status(409).json({
        success: false,
        message: "You have already purchased this book",
        purchase: existingPurchase,
      });
    }

    /*
    --------------------------------------------
    Create Purchase
    --------------------------------------------
    */

    const purchase = await Purchase.create({
      UserId: userId,
      BookId: bookId,
      payment_id: payment_id,
    });

    /*
    --------------------------------------------
    Return Purchase with Book + User
    --------------------------------------------
    */

    const result = await Purchase.findByPk(purchase.id, {
      include: [
        {
          model: Book,
        },
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
    });

    console.log("✅ Purchase created:", result.toJSON());

    return res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      purchase: result,
    });

  } catch (error) {
    console.error("❌ Purchase POST error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase",
      error: error.message,
    });
  }
});


module.exports = router;