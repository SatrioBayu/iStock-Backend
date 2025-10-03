const express = require("express");
const router = express.Router();
const authenticationController = require("../controller/authenticationController");
const adminController = require("../controller/adminController");
const requestController = require("../controller/requestController");

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
// Mengambil data transaksi untuk semua barang
router.get(
  "/admin/barang/transaksi",
  authenticationController.authorize,
  adminController.handleGetAllTransaksi
);
// Menambah data barang
router.post(
  "/admin/barang",
  authenticationController.authorize,
  adminController.handleCreateBarang
);
// Mengupdate data barang
router.patch(
  "/admin/barang/:barcode",
  authenticationController.authorize,
  adminController.handleUpdateBarang
);

// Request
// Add Request
router.post("/request", requestController.handleAddRequest);
// Get All Request
router.get("/request", requestController.handleGetAllRequest);
// Get Request by Kode
router.get("/request/:kode_request", requestController.handleGetRequestByKode);
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
