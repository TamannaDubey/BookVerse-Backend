const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Book = require("../models/Book");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDir = path.join(__dirname, "../uploads/books");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  }
});

// =====================================================
// FILE VALIDATION
// =====================================================

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  // BOOK PDF
  if (file.fieldname === "book_file") {
    if (extension !== ".pdf" || file.mimetype !== "application/pdf") {
      return cb(new Error("Book file must be PDF only"));
    }
  }

  // SAMPLE PDF
  if (file.fieldname === "sample_file") {
    if (extension !== ".pdf" || file.mimetype !== "application/pdf") {
      return cb(new Error("Sample file must be PDF only"));
    }
  }

  // COVER IMAGE
  if (file.fieldname === "cover_file") {
    const allowedImages = [".jpg", ".jpeg", ".png"];
    const allowedMime = ["image/jpeg", "image/png"];

    if (
      !allowedImages.includes(extension) ||
      !allowedMime.includes(file.mimetype)
    ) {
      return cb(
        new Error("Cover image must be JPG, JPEG or PNG only")
      );
    }
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

// =====================================================
// GET ALL BOOKS
// =====================================================

router.get("/", async (req, res) => {
  try {
    const books = await Book.findAll({
      order: [["id", "DESC"]]
    });

    res.json(books);
  } catch (err) {
    console.error("❌ Get books error:", err);

    res.status(500).json({
      error: "Failed to fetch books"
    });
  }
});

// =====================================================
// GET SINGLE BOOK
// =====================================================

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({
        error: "Book not found"
      });
    }

    res.json(book);
  } catch (err) {
    console.error("❌ Get book error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================================
// ADD BOOK
// =====================================================

router.post(
  "/",
  adminAuth,
  upload.fields([
    { name: "cover_file", maxCount: 1 },
    { name: "sample_file", maxCount: 1 },
    { name: "book_file", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        title,
        author,
        price
      } = req.body;

      // -------------------------
      // BASIC VALIDATION
      // -------------------------

      if (!title || !title.trim()) {
        return res.status(400).json({
          error: "Book title is required"
        });
      }

      if (price === undefined || price === "") {
        return res.status(400).json({
          error: "Price is required"
        });
      }

      if (Number(price) < 0) {
        return res.status(400).json({
          error: "Price cannot be negative"
        });
      }

      // -------------------------
      // REQUIRED FILES
      // -------------------------

      if (!req.files?.book_file) {
        return res.status(400).json({
          error: "Book PDF is required"
        });
      }

      if (!req.files?.cover_file) {
        return res.status(400).json({
          error: "Cover image is required"
        });
      }

      if (!req.files?.sample_file) {
        return res.status(400).json({
          error: "Sample PDF is required"
        });
      }

      // -------------------------
      // FILE PATHS
      // -------------------------

      const coverFile = req.files.cover_file[0];
      const sampleFile = req.files.sample_file[0];
      const bookFile = req.files.book_file[0];

      const coverUrl = `/uploads/books/${coverFile.filename}`;
      const sampleUrl = `/uploads/books/${sampleFile.filename}`;
      const bookUrl = `/uploads/books/${bookFile.filename}`;

      // -------------------------
      // CREATE BOOK
      // -------------------------

      const book = await Book.create({
        title: title.trim(),
        author: author ? author.trim() : null,
        cover_image: coverUrl,
        price: Number(price),
        sample_url: sampleUrl,
        full_content_url: bookUrl
      });

      res.status(201).json({
        message: "Book added successfully",
        book
      });

    } catch (err) {
      console.error("❌ Add book error:", err);

      res.status(500).json({
        error: err.message
      });
    }
  }
);

// =====================================================
// UPDATE BOOK
// =====================================================

router.put(
  "/:id",
  adminAuth,
  upload.fields([
    { name: "cover_file", maxCount: 1 },
    { name: "sample_file", maxCount: 1 },
    { name: "book_file", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const book = await Book.findByPk(req.params.id);

      if (!book) {
        return res.status(404).json({
          error: "Book not found"
        });
      }

      const { title, author, price } = req.body;

if (!title || !title.trim()) {
  return res.status(400).json({
    message: "Title is required",
  });
}

if (price === undefined || price === "") {
  return res.status(400).json({
    message: "Price is required",
  });
}

if (Number.isNaN(Number(price)) || Number(price) < 0) {
  return res.status(400).json({
    message: "Please enter a valid price",
  });
}

const updateData = {
  title: title.trim(),
  author: author ? author.trim() : null,
  price: Number(price),
};
      // New cover uploaded
      if (req.files?.cover_file) {
        updateData.cover_image =
          `/uploads/books/${req.files.cover_file[0].filename}`;
      }

      // New sample uploaded
      if (req.files?.sample_file) {
        updateData.sample_url =
          `/uploads/books/${req.files.sample_file[0].filename}`;
      }

      // New full book uploaded
      if (req.files?.book_file) {
        updateData.full_content_url =
          `/uploads/books/${req.files.book_file[0].filename}`;
      }

      await book.update(updateData);

      res.json({
        message: "Book updated successfully",
        book
      });

    } catch (err) {
      console.error("❌ Update error:", err);

      res.status(500).json({
        error: err.message
      });
    }
  }
);

// =====================================================
// DELETE BOOK
// =====================================================

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({
        error: "Book not found"
      });
    }

    // Delete associated files
    const filesToDelete = [
      book.cover_image,
      book.sample_url,
      book.full_content_url
    ];

    filesToDelete.forEach((fileUrl) => {
      if (fileUrl) {
        const fileName = path.basename(fileUrl);
        const filePath = path.join(uploadDir, fileName);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    await book.destroy();

    res.json({
      message: "Book deleted successfully"
    });

  } catch (err) {
    console.error("❌ Delete error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

// =====================================================
// MULTER ERROR HANDLER
// =====================================================

router.use((err, req, res, next) => {
  console.error("❌ Upload error:", err);

  res.status(400).json({
    error: err.message || "File upload failed"
  });
});

module.exports = router;