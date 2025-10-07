const dayjs = require("dayjs");

// Mock model dan dependensi eksternal
jest.mock("../models", () => ({
  Admin: { findByPk: jest.fn() },
  Barang: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  TransaksiPembelian: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  Request_Detail: { update: jest.fn() },
  sequelize: {
    transaction: jest.fn(() => ({ commit: jest.fn(), rollback: jest.fn() })),
  },
}));

jest.mock("../config/cloudinaryConfig", () => ({
  uploader: {
    upload: jest.fn(() =>
      Promise.resolve({ secure_url: "url", public_id: "publicId" })
    ),
    destroy: jest.fn(),
  },
}));

jest.mock("exceljs", () => {
  const addRow = jest.fn();
  const addWorksheet = jest.fn(() => ({
    columns: [],
    addRow,
  }));
  return {
    Workbook: jest.fn(() => ({
      addWorksheet,
      xlsx: { write: jest.fn().mockResolvedValue() },
    })),
  };
});

const {
  handleGetUser,
  handleAddTransaksi,
  handleDeleteTransaksiById,
  handleGetAllTransaksiByBarcode,
  handleCreateBarang,
  handleGetAllTransaksi,
  handleUpdateBarang,
  handleGetAllBarang,
  handleGetAllBarangForRequest,
  handleGetBarangByBarcode,
  handleDeleteBarang,
} = require("../controller/adminController");

const {
  Admin,
  Barang,
  TransaksiPembelian,
  Request_Detail,
} = require("../models");

// Utility untuk response mock
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.attachment = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {}); // biar log error diabaikan
});

describe("Admin Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("handleGetUser berhasil", async () => {
    const req = { user: { id: 1 } };
    const res = makeRes();
    Admin.findByPk.mockResolvedValue({ id: 1, nama: "Admin Test" });

    await handleGetUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Successfully get user",
      })
    );
  });

  test("handleAddTransaksi gagal jika barang tidak ditemukan", async () => {
    const req = { params: { barcode: "999" } };
    const res = makeRes();
    Barang.findByPk.mockResolvedValue(null);

    await handleAddTransaksi(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("handleAddTransaksi berhasil", async () => {
    const req = {
      params: { barcode: "123" },
      body: {
        jumlah_dibeli: 5,
        harga_satuan: 1000,
        harga_total: 5000,
        nama_toko: "Toko A",
        tanggal_transaksi: "2025-01-01",
      },
    };
    const res = makeRes();
    Barang.findByPk.mockResolvedValue({ stok: 10 });
    TransaksiPembelian.create.mockResolvedValue({ id: 1 });
    Barang.update.mockResolvedValue([1]);

    await handleAddTransaksi(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("handleDeleteTransaksiById berhasil hapus transaksi", async () => {
    const req = { params: { id: "1" } };
    const res = makeRes();
    TransaksiPembelian.findByPk.mockResolvedValue({
      id: 1,
      barcode_barang: "123",
      jumlah_dibeli: 2,
      destroy: jest.fn(),
    });
    Barang.findByPk.mockResolvedValue({
      stok: 10,
      update: jest.fn(),
    });

    await handleDeleteTransaksiById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("handleGetAllTransaksiByBarcode berhasil", async () => {
    const req = { params: { barcode: "123" } };
    const res = makeRes();
    TransaksiPembelian.findAll.mockResolvedValue([{ id: 1 }]);

    await handleGetAllTransaksiByBarcode(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("handleCreateBarang berhasil tanpa gambar", async () => {
    const req = {
      body: {
        barcode: "123",
        nama_barang: "Barang A",
        stok: 10,
        satuan: "pcs",
      },
    };
    const res = makeRes();
    Barang.findByPk.mockResolvedValue(null);
    Barang.create.mockResolvedValue({});

    await handleCreateBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("handleGetAllTransaksi menghasilkan file Excel", async () => {
    const req = {};
    const res = makeRes();
    TransaksiPembelian.findAll.mockResolvedValue([
      {
        tanggal_transaksi: new Date(),
        barcode_barang: "123",
        Barang: { nama_barang: "A" },
        jumlah_dibeli: 1,
        harga_satuan: 100,
        harga_total: 100,
        nama_toko: "Toko A",
      },
    ]);

    await handleGetAllTransaksi(req, res);
    expect(res.end).toHaveBeenCalled();
  });

  test("handleGetAllBarang berhasil", async () => {
    const req = {};
    const res = makeRes();
    Barang.findAll.mockResolvedValue([{ barcode: "1" }]);

    await handleGetAllBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("handleGetBarangByBarcode tidak ditemukan", async () => {
    const req = { params: { barcode: "999" } };
    const res = makeRes();
    Barang.findByPk.mockResolvedValue(null);

    await handleGetBarangByBarcode(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("handleDeleteBarang berhasil", async () => {
    const req = { params: { barcode: "123" } };
    const res = makeRes();
    Barang.findByPk.mockResolvedValue({ destroy: jest.fn() });

    await handleDeleteBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("handleGetAllBarangForRequest berhasil", async () => {
    const req = {};
    const res = makeRes();
    Barang.findAll.mockResolvedValue([{ barcode: "1", stok: 5 }]);

    await handleGetAllBarangForRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("handleCreateBarang gagal karena barcode sudah digunakan", async () => {
    const req = { body: { barcode: "123", nama_barang: "Barang A" } };
    const res = makeRes();
    Barang.findByPk.mockResolvedValue({ nama_barang: "Lama" });

    await handleCreateBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.any(Array),
      })
    );
  });

  test("handleUpdateBarang gagal karena stok minus", async () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    const req = {
      params: { oldBarcode: "123" },
      body: {
        barcode: "123",
        nama_barang: "Barang A",
        stok: -5,
        satuan: "pcs",
      },
    };
    const res = makeRes();
    const { sequelize } = require("../models");
    sequelize.transaction.mockResolvedValue(t);

    await handleUpdateBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(t.rollback).toHaveBeenCalled();
  });

  test("handleUpdateBarang gagal karena barang tidak ditemukan", async () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    const req = {
      params: { oldBarcode: "999" },
      body: { barcode: "999", nama_barang: "X", stok: 5, satuan: "pcs" },
    };
    const res = makeRes();
    const { sequelize, Barang } = require("../models");
    sequelize.transaction.mockResolvedValue(t);
    Barang.findByPk.mockResolvedValue(null);

    await handleUpdateBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("handleUpdateBarang gagal karena barcode baru sudah digunakan", async () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    const req = {
      params: { oldBarcode: "111" },
      body: { barcode: "222", nama_barang: "B", stok: 5, satuan: "pcs" },
    };
    const res = makeRes();
    const { sequelize, Barang } = require("../models");
    sequelize.transaction.mockResolvedValue(t);
    Barang.findByPk
      .mockResolvedValueOnce({ barcode: "111", stok: 10 }) // barang lama
      .mockResolvedValueOnce({ nama_barang: "Barang Baru" }); // barcode baru sudah ada

    await handleUpdateBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("handleUpdateBarang berhasil update barcode dan upload file baru", async () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    const req = {
      params: { oldBarcode: "111" },
      body: { barcode: "222", nama_barang: "B", stok: 5, satuan: "pcs" },
      file: { buffer: Buffer.from("x"), mimetype: "image/png" },
    };
    const res = makeRes();
    const {
      sequelize,
      Barang,
      TransaksiPembelian,
      Request_Detail,
    } = require("../models");
    sequelize.transaction.mockResolvedValue(t);
    Barang.findByPk
      .mockResolvedValueOnce({
        barcode: "111",
        stok: 10,
        foto_public_id: "old",
        foto: "oldurl",
      }) // barang lama
      .mockResolvedValueOnce(null); // barcode baru belum ada
    TransaksiPembelian.update.mockResolvedValue(1);
    Request_Detail.update.mockResolvedValue(1);
    Barang.update.mockResolvedValue(1);
    Barang.findByPk.mockResolvedValueOnce({ barcode: "222" });

    await handleUpdateBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(t.commit).toHaveBeenCalled();
  });

  test("handleGetAllBarang gagal karena error DB", async () => {
    const req = {};
    const res = makeRes();
    Barang.findAll.mockRejectedValue(new Error("DB error"));
    await handleGetAllBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("handleDeleteBarang gagal karena barang tidak ditemukan", async () => {
    const req = { params: { barcode: "999" } };
    const res = makeRes();
    Barang.findByPk.mockResolvedValue(null);
    await handleDeleteBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("handleCreateBarang gagal karena exception tak terduga", async () => {
    const req = { body: { barcode: "111", nama_barang: "Barang Error" } };
    const res = makeRes();
    Barang.findByPk.mockRejectedValue(new Error("DB crash"));
    await handleCreateBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("handleUpdateBarang gagal karena kesalahan update DB", async () => {
    const t = { commit: jest.fn(), rollback: jest.fn() };
    const req = {
      params: { oldBarcode: "111" },
      body: { barcode: "111", nama_barang: "B", stok: 10, satuan: "pcs" },
    };
    const res = makeRes();
    const { sequelize, Barang } = require("../models");
    sequelize.transaction.mockResolvedValue(t);
    Barang.findByPk
      .mockResolvedValueOnce({ barcode: "111", stok: 5 })
      .mockResolvedValueOnce(null);
    Barang.update.mockRejectedValue(new Error("Update fail"));

    await handleUpdateBarang(req, res);
    expect(t.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("handleDeleteBarang gagal karena error DB saat findByPk", async () => {
    const req = { params: { barcode: "ERR" } };
    const res = makeRes();
    Barang.findByPk.mockRejectedValue(new Error("DB read error"));
    await handleDeleteBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("handleDeleteBarang gagal karena error saat destroy", async () => {
    const req = { params: { barcode: "111" } };
    const res = makeRes();
    const mockBarang = {
      destroy: jest.fn().mockRejectedValue(new Error("Cannot delete")),
    };
    Barang.findByPk.mockResolvedValue(mockBarang);

    await handleDeleteBarang(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("handleAddTransaksi gagal karena error DB", async () => {
    const req = { body: { barcode: "111", jumlah: 2, jenis: "masuk" } };
    const res = makeRes();
    const { TransaksiPembelian } = require("../models");
    TransaksiPembelian.create.mockRejectedValue(new Error("DB fail"));

    await handleAddTransaksi(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
