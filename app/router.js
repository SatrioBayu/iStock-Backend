const express = require("express");
const router = express.Router();
const authenticationController = require("../controller/authenticationController");
const adminController = require("../controller/adminController");
const requestController = require("../controller/requestController");
const upload = require("../middleware/uploadMiddleware");

router.get("/", (req, res) => {
  res.send({
    message: "Server is running",
  });
});

router.post("/login", authenticationController.handleLogin);
router.get(
  "/user",
  authenticationController.authorize,
  adminController.handleGetUser
);

// Barang
// Mengambil data semua barang
router.get("/admin/barang", adminController.handleGetAllBarang);
// Mengambil data semua barang yang memiliki stok > 0 (untuk keperluan request)
router.get(
  "/admin/barang/for-request",
  adminController.handleGetAllBarangForRequest
);
// Mengambil data transaksi untuk semua barang
router.get(
  "/admin/barang/transaksi",
  authenticationController.authorize,
  adminController.handleGetAllTransaksi
);
// Mengambil data barang berdasarkan barcode
router.get("/admin/barang/:barcode", adminController.handleGetBarangByBarcode);
// Menambah data barang
router.post(
  "/admin/barang",
  authenticationController.authorize,
  upload.single("foto"),
  adminController.handleCreateBarang
);
// Mengupdate data barang
router.patch(
  "/admin/barang/:oldBarcode",
  authenticationController.authorize,
  upload.single("foto"),
  adminController.handleUpdateBarang
);
router.delete(
  "/admin/barang/:barcode",
  authenticationController.authorize,
  adminController.handleDeleteBarang
);

// Transaksi
// Tambah Transaksi pada Barang + Update Stok Barang
router.post(
  "/admin/barang/transaksi/add/:barcode",
  authenticationController.authorize,
  adminController.handleAddTransaksi
);
// Mengambil data transaksi untuk setiap barang
router.get(
  "/admin/barang/transaksi/:barcode",
  authenticationController.authorize,
  adminController.handleGetAllTransaksiByBarcode
);
// Menghapus data transaksi pada barang berdasarkan ID transaksi
router.delete(
  "/admin/barang/transaksi/:id",
  authenticationController.authorize,
  adminController.handleDeleteTransaksiById
);

// Request
// Add Request
router.post("/request", requestController.handleAddRequest);
// Get All Request
router.get("/request", requestController.handleGetAllRequest);
// Get Request by Kode
router.get("/request/:kode_request", requestController.handleGetRequestByKode);
// Download Request by Kode
router.get(
  "/request/:kode_request/download",
  requestController.handleDownloadRequestByKode
);
// Approved Request
router.patch(
  "/request/:kode_request/approve",
  authenticationController.authorize,
  authenticationController.checkRole(["Kasubbag TURT"]),
  requestController.handleApproved
);
// Reject Request
router.patch(
  "/request/:kode_request/reject",
  authenticationController.authorize,
  authenticationController.checkRole(["Kasubbag TURT"]),
  requestController.handleReject
);
// Finish Request
router.patch(
  "/request/:kode_request/finish",
  authenticationController.authorize,
  authenticationController.checkRole(["Pengelola BMN"]),
  requestController.handleFinish
);

module.exports = router;
