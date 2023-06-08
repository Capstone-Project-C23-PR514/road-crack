const express = require("express")
const router = express.Router()
const cors = require('cors')
const bodyParser = require('body-parser')
const auth = require('../middleware/auth')
const ReportsModel = require("../models/reports")
const { Sequelize } = require("sequelize")

router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: false }));

// Rute untuk menerima data dari FastAPI dan menyimpan data di tabel reports
router.post('/upload', auth, async (req, res) => {
  try {
    const { judul, lokasi, desc, akurasi, gambar } = req.body
    const user_id = req.user.id; // Ambil ID pengguna dari data autentikasi (middleware auth)

    // Simpan data ke dalam tabel reports menggunakan model Report
    const report = await ReportsModel.create({
      user_id,
      judul,
      gambar,
      lokasi,
      desc,
      akurasi
    })

    res.status(200).json({
      status: 200,
      message: 'Data berhasil diinput',
      data: report
    });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan saat menginput data' })
  }
})

router.delete("/delete/:reportId", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.reportId;

    // Menghapus data reminder berdasarkan user_id dan reminder_id
    const deletedReport = await ReportsModel.destroy({
      where: { user_id: userId, id: reportId },
    });

    if (deletedReport === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({
      message: "Report successfully deleted",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete report" });
  }
});



module.exports = router