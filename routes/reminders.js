require("dotenv").config();
const express = require("express");
const router = express.Router();
const RemindersModel = require("../models/reminders");
const cors = require("cors");
const bodyParser = require("body-parser");
const auth = require("../middleware/auth");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const Sequelize = require("sequelize");

router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

// Konfigurasi penyimpanan file menggunakan Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Buat instance Google Cloud Storage
const storageClient = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: "lippo-capstone.json", // Ganti dengan path yang benar ke file kredensial Anda
});
const bucket = storageClient.bucket("road-crack-model"); // Ganti dengan nama bucket Anda

router.get("/", auth, async (req, res) => {
  try {
    const reminders = await RemindersModel.findAll();

    res.status(200).json({
      data: reminders,
    });
  } catch (error) {
    res.status(500).json({
      error: "Terjadi kesalahan",
    });
  }
});

router.post("/create", auth, upload.single("gambar"), async (req, res) => {
  try {
    const { tanggal_awal, tanggal_akhir, lokasi, catatan } = req.body;
    const user_id = req.user.id;
    const gambar = req.file; // Mengambil informasi file gambar yang diunggah

    // Menentukan nama file di Google Cloud Storage
    const namaFile = Date.now() + "-" + gambar.originalname;

    // Mengunggah file ke Google Cloud Storage
    const file = bucket.file(namaFile);
    const stream = file.createWriteStream({
      metadata: {
        contentType: gambar.mimetype,
      },
    });

    stream.on("error", (error) => {
      console.error("Error saat mengunggah file:", error);
      res.status(500).json({
        error: "Data gagal diinput",
      });
    });

    stream.on("finish", async () => {
      try {
        // Membuat data reminder dengan informasi gambar dari Google Cloud Storage
        const createReminder = await RemindersModel.create({
          user_id,
          tanggal_awal,
          tanggal_akhir,
          gambar: `https://storage.googleapis.com/${bucket.name}/${namaFile}`,
          lokasi,
          catatan,
        });

        res.status(200).json({
          message: "Data reminder berhasil diinput",
          data: createReminder,
        });
      } catch (error) {
        console.error("Error saat membuat data reminder:", error);
        res.status(500).json({
          error: "Data gagal diinput",
        });
      }
    });

    stream.end(gambar.buffer);
  } catch (error) {
    console.error("Error saat mengolah data:", error);
    res.status(500).json({
      error: "Terjadi kesalahan",
    });
  }
});

router.get("/detail/:reminderId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reminderId = req.params.reminderId;

    // Mengambil data report berdasarkan user_id dan report_id
    const detailReminder = await RemindersModel.findOne({
      where: { user_id: userId, id: reminderId },
    });

    if (!detailReminder) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({
      data: detailReminder,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat mengambil detail report" });
  }
});

router.put("/edit/:reminderId", auth, upload.single("gambar"), async (req, res) => {
  try {
    const userId = req.user.id;
    const reminderId = req.params.reminderId;
    const { tanggal_awal, tanggal_akhir, lokasi, catatan } = req.body;
    let gambar = req.file; // Mengambil informasi file gambar yang diunggah

    // Mengecek apakah ada file gambar baru yang diunggah
    if (gambar) {
      // Menentukan nama file di Google Cloud Storage
      const namaFile = Date.now() + "-" + gambar.originalname;

      // Mengunggah file ke Google Cloud Storage
      const file = bucket.file(namaFile);
      const stream = file.createWriteStream({
        metadata: {
          contentType: gambar.mimetype,
        },
      });

      stream.on("error", (error) => {
        console.error("Error saat mengunggah file:", error);
        res.status(500).json({
          error: "Data gagal diupdate",
        });
      });

      stream.on("finish", async () => {
        try {
          // Mengupdate data reminder dengan informasi gambar baru dari Google Cloud Storage
          const updatedReminder = await RemindersModel.update(
            {
              tanggal_awal,
              tanggal_akhir,
              gambar: `https://storage.googleapis.com/${bucket.name}/${namaFile}`,
              lokasi,
              catatan,
            },
            {
              where: { user_id: userId, id: reminderId },
            }
          );

          res.status(200).json({
            message: "Data reminder berhasil diupdate",
          });
        } catch (error) {
          console.error("Error saat mengupdate data reminder:", error);
          res.status(500).json({
            error: "Data gagal diupdate",
          });
        }
      });

      stream.end(gambar.buffer);
    } else {
      // Jika tidak ada gambar baru yang diunggah, hanya mengupdate data reminder tanpa mengubah gambar
      const updatedReminder = await RemindersModel.update(
        {
          tanggal_awal,
          tanggal_akhir,
          lokasi,
          catatan,
        },
        {
          where: { user_id: userId, id: reminderId },
        }
      );

      res.status(200).json({
        message: "Data reminder berhasil diupdate",
        data: updatedReminder,
      });
    }
  } catch (error) {
    console.error("Error saat mengolah data:", error);
    res.status(500).json({
      error: "Terjadi kesalahan",
    });
  }
});

router.get("/search", auth, async (req, res) => {
  try {
    const searchReminder = await RemindersModel.findAll({
      where: {
        [Sequelize.Op.or]: [
          { lokasi: { [Sequelize.Op.like]: `%${req.query.search}%` } },
          { catatan: { [Sequelize.Op.like]: `%${req.query.search}%` } },
        ],
      },
    });
    if (searchReminder.length > 0) {
      res.status(200).json({
        data: searchReminder,
      });
    } else {
      res.status(200).json({
        message: "Data tidak ditemukan",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Pencarian gagal",
    });
  }
});

router.delete("/delete/:reminderId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reminderId = req.params.reminderId;

    // Menghapus data reminder berdasarkan user_id dan reminder_id
    const deletedReminder = await RemindersModel.destroy({
      where: { user_id: userId, id: reminderId },
    });

    if (deletedReminder === 0) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    res.status(200).json({
      message: "Reminder successfully deleted",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});


module.exports = router;