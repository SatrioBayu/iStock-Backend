const { Admin, Barang, TransaksiPembelian } = require("../models");

const handleGetUser = async (req, res) => {
  try {
    const user = await Admin.findByPk(req.user.id);
    res.status(200).json({
      message: "Successfully get user",
      data: user,
    });
  } catch (error) {
    return res.send([
      {
        code: "E-005",
        message: error.message,
      },
    ]);
  }
};

const handleAddTransaksi = async (req, res) => {
  try {
    const { barcode } = req.params;
    const barang = await Barang.findByPk(barcode);
    if (!barang) {
      return res.status(404).send([
        {
          code: "E-006",
          message: "Barang tidak ditemukan",
        },
      ]);
    }
    const { jumlah_dibeli, harga_satuan, harga_total, nama_toko } = req.body;
    const newTransaksi = await TransaksiPembelian.create({
      barcode_barang: barcode,
      tanggal_transaksi: new Date(),
      jumlah_dibeli,
      harga_satuan,
      harga_total,
      nama_toko,
    });

    const stokBaru = Number(barang.stok) + Number(jumlah_dibeli);

    const updateBarang = await Barang.update(
      {
        stok: stokBaru,
      },
      {
        where: {
          barcode,
        },
      }
    );

    return res.status(201).json([
      {
        message: "Transaksi successfully created",
        data: newTransaksi,
      },
      {
        message: "Barang successfully updated",
        data: updateBarang,
      },
    ]);
  } catch (error) {
    return res.send([
      {
        code: "E-007",
        message: error.message,
      },
    ]);
  }
};

const handleGetAllTransaksiByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const transaksi = await TransaksiPembelian.findAll({
      where: {
        barcode_barang: barcode,
      },
    });

    return res.status(201).json({
      message: "Transaksi successfully fetched",
      data: transaksi,
    });
  } catch (error) {
    return res.send([
      {
        code: "E-007",
        message: error.message,
      },
    ]);
  }
};

const handleCreateBarang = async (req, res) => {
  try {
    const { barcode, nama_barang, stok, satuan } = req.body;
    const barang = await Barang.create({
      barcode,
      nama_barang,
      stok,
      satuan,
    });

    return res.status(201).json({
      message: "Barang successfully created",
      data: barang,
    });
  } catch (error) {
    return res.send({
      code: "E-008",
      message: error.message,
    });
  }
};

const handleGetAllTransaksi = async (req, res) => {
  try {
    const transaksi = await TransaksiPembelian.findAll();

    return res.status(201).json({
      message: "Transaksi successfully fetched",
      data: transaksi,
    });
  } catch (error) {
    return res.send([
      {
        code: "E-007",
        message: error.message,
      },
    ]);
  }
};

const handleUpdateBarang = async (req, res) => {
  try {
    const { barcode } = req.params;
    const { nama_barang, stok, satuan } = req.body;
    const barang = await Barang.findByPk(barcode);

    const newStock = stok ?? barang.stok;

    await barang.update(
      {
        nama_barang,
        stok: newStock,
        satuan,
      },
      {
        where: {
          barcode,
        },
      }
    );
    return res.status(200).json({
      message: "Successfully update barang",
      data: barang,
    });
  } catch (error) {
    return res.send([
      {
        code: "E-007",
        message: error.message,
      },
    ]);
  }
};

module.exports = {
  handleGetUser,
  handleAddTransaksi,
  handleGetAllTransaksiByBarcode,
  handleCreateBarang,
  handleGetAllTransaksi,
  handleUpdateBarang,
};
