const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const Purchase = require("../models/Purchase");
const Book = require("../models/Book");
const userAuth = require("../middleware/userAuth");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/*
====================================================
CREATE RAZORPAY ORDER
POST /payment/create-order
====================================================
*/

router.post("/create-order", userAuth, async (req, res) => {
  try {
    const { book_id } = req.body;

    console.log("🔥 /payment/create-order called");
    console.log("User:", req.user.id);
    console.log("Book ID:", book_id);

    if (!book_id) {
      return res.status(400).json({
        success: false,
        message: "book_id is required",
      });
    }

    const book = await Book.findByPk(Number(book_id));

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    console.log("📚 Book found:", {
      id: book.id,
      title: book.title,
      price: book.price,
      priceType: typeof book.price,
    });

    // Already purchased?
    const existingPurchase = await Purchase.findOne({
      where: {
        UserId: Number(req.user.id),
        BookId: Number(book_id),
      },
    });

    if (existingPurchase) {
      return res.status(409).json({
        success: false,
        message: "You have already purchased this book",
      });
    }

    // Convert database price to number
    const amount = Number(book.price);

    console.log("💰 Amount:", amount);

    // Strict validation
    if (!Number.isFinite(amount) || amount <= 0) {
      console.error("❌ Invalid book price:", book.price);

      return res.status(400).json({
        success: false,
        message: "Invalid book price",
      });
    }

    // Razorpay requires amount in paise
    const amountInPaise = Math.round(amount * 100);

    console.log("💰 Amount in paise:", amountInPaise);

    if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `book_${book.id}_user_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: String(req.user.id),
        book_id: String(book.id),
      },
    };

    console.log("📦 Razorpay options:", {
      amount: options.amount,
      currency: options.currency,
      receipt: options.receipt,
    });

    const order = await razorpay.orders.create(options);

    console.log("✅ Razorpay order created:", order.id);

    return res.status(200).json({
      success: true,
      order,
      book: {
        id: book.id,
        title: book.title,
        price: amount,
      },
    });

  } catch (error) {
    console.error("❌ Create order error:", error);

    console.error("❌ Razorpay error details:", {
      message: error.message,
      statusCode: error.statusCode,
      description: error.error?.description,
      code: error.error?.code,
      metadata: error.error?.metadata,
    });

    return res.status(500).json({
      success: false,
      message:
        error.error?.description ||
        error.message ||
        "Failed to create payment order",
    });
  }
});


/*
====================================================
VERIFY RAZORPAY PAYMENT
POST /payment/verify
====================================================
*/

router.post("/verify", userAuth, async (req, res) => {
  try {
    const {
      order_id,
      payment_id,
      signature,
      book_id,
    } = req.body;

    console.log("🔥 /payment/verify called");
    console.log("User:", req.user.id);
    console.log("Book:", book_id);

    if (!order_id || !payment_id || !signature || !book_id) {
      return res.status(400).json({
        success: false,
        message:
          "order_id, payment_id, signature and book_id are required",
      });
    }

    // Find book
    const book = await Book.findByPk(Number(book_id));

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check duplicate purchase
    const existingPurchase = await Purchase.findOne({
      where: {
        UserId: Number(req.user.id),
        BookId: Number(book_id),
      },
    });

    if (existingPurchase) {
      return res.status(409).json({
        success: false,
        message: "Book already purchased",
      });
    }

    /*
    --------------------------------------------
    Razorpay signature verification
    --------------------------------------------
    */

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      console.log("❌ Invalid Razorpay signature");

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
    /*
--------------------------------------------
FETCH AND VALIDATE RAZORPAY ORDER
--------------------------------------------
*/

const razorpayOrder = await razorpay.orders.fetch(order_id);

if (
  !razorpayOrder ||
  razorpayOrder.notes?.user_id !== String(req.user.id) ||
  razorpayOrder.notes?.book_id !== String(book.id)
) {
  return res.status(400).json({
    success: false,
    message: "Payment order does not match user or book",
  });
}

    /*
    --------------------------------------------
    Create Purchase
    --------------------------------------------
    */

    const purchase = await Purchase.create({
      UserId: Number(req.user.id),
      BookId: Number(book_id),
      payment_id: payment_id,
    });

    const result = await Purchase.findByPk(
      purchase.id,
      {
        include: [Book],
      }
    );

    console.log("✅ Purchase created:", result.toJSON());

    return res.status(200).json({
      success: true,
      message: "Payment verified, book unlocked!",
      purchase: result,
    });

  } catch (error) {
    console.error("❌ Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
});


module.exports = router;