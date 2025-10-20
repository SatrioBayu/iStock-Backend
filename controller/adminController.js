const { where, Op } = require("sequelize");
const {
  Admin,
  Barang,
  TransaksiPembelian,
  Request_Detail,
  sequelize,
} = require("../models");
const ExcelJS = require("exceljs");
const dayjs = require("dayjs");
const cloudinary = require("../config/cloudinaryConfig");

const handleGetUser = async (req, res) => {
  try {
    const user = await Admin.findByPk(req.user.id);
    res.status(200).json({
      message: "Successfully get user",
      data: user,
    });
  } catch (error) {
    return res.status(500).send([
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
    const {
      jumlah_dibeli,
      harga_satuan,
      harga_total,
      nama_toko,
      tanggal_transaksi,
    } = req.body;

    if (
      jumlah_dibeli === null ||
      harga_satuan === null ||
      harga_total === null ||
      nama_toko === "" ||
      tanggal_transaksi === ""
    ) {
      return res.status(400).send({
        code: "E-010",
        message: "Tidak boleh ada field  yang kosong",
      });
    }

    const newTransaksi = await TransaksiPembelian.create({
      barcode_barang: barcode,
      tanggal_transaksi: new Date(tanggal_transaksi),
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
    return res.status(500).send([
      {
        code: "E-007",
        message: error.message,
      },
    ]);
  }
};

const handleDeleteTransaksiById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaksi = await TransaksiPembelian.findByPk(id);
    if (!transaksi) {
      return res.status(404).send([
        {
          code: "E-007",
          message: "Transaksi not found",
        },
      ]);
    }
    // Kurangi stok barang sesuai jumlah_dibeli pada transaksi yang dihapus
    const barang = await Barang.findByPk(transaksi.barcode_barang);
    if (barang) {
      const newStock = barang.stok - transaksi.jumlah_dibeli;
      await barang.update({ stok: newStock });
    }
    await transaksi.destroy();
    const updatedBarang = await Barang.findByPk(transaksi.barcode_barang, {
      include: [
        {
          model: TransaksiPembelian,
        },
      ],
    });
    return res.status(200).json({
      message: "Successfully delete transaksi",
      data: updatedBarang,
    });
  } catch (error) {
    return res.status(500).send([
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
    return res.status(500).send([
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

    // console.log(req.body);
    // console.log(req.file);

    // Cek barcode sudah ada atau belum
    const barangCheck = await Barang.findByPk(barcode);
    if (barangCheck) {
      return res.status(400).json({
        errors: [
          {
            code: "E-008",
            message: `Barcode ${barcode} sudah digunakan di barang ${barangCheck.nama_barang}`,
          },
        ],
      });
    }

    let fotoUrl = null;
    let imagePublicId = null;
    // Jika ada file gambar, upload ke Cloudinary
    if (req.file) {
      const uploadResult = await uploadImageToCloudinary(req.file);
      fotoUrl = uploadResult.url;
      imagePublicId = uploadResult.publicId;
    }

    await Barang.create({
      barcode,
      nama_barang,
      stok,
      satuan,
      foto: fotoUrl,
      foto_public_id: imagePublicId,
    });

    return res.status(201).json({
      message: "Barang successfully created",
    });
  } catch (error) {
    return res.status(500).send({
      code: "E-008",
      message: error.message,
    });
  }
};

const handleGetAllTransaksi = async (req, res) => {
  try {
    // Get all transaksi
    const transaksi = await TransaksiPembelian.findAll({
      include: [
        {
          model: Barang,
          attributes: ["barcode", "nama_barang"],
        },
      ],
    });

    // Buat workbook dan worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transaksi Pembelian");

    // Definisikan kolom
    worksheet.columns = [
      { header: "Tanggal dan Jam", key: "tanggal_transaksi", width: 20 },
      { header: "Barcode", key: "barcode", width: 20 },
      { header: "Nama Barang", key: "nama_barang", width: 20 },
      { header: "Jumlah Masuk", key: "jumlah_dibeli", width: 20 },
      { header: "Harga Satuan", key: "harga_satuan", width: 20 },
      { header: "Harga Total", key: "harga_total", width: 20 },
      { header: "Nama Toko", key: "nama_toko", width: 20 },
    ];

    transaksi.forEach((item) => {
      worksheet.addRow({
        tanggal_transaksi: dayjs(item.tanggal_transaksi).format(
          "DD/MM/YYYY HH:mm:ss"
        ),
        barcode: item.barcode_barang,
        nama_barang: item.Barang.nama_barang,
        jumlah_dibeli: item.jumlah_dibeli,
        harga_satuan: item.harga_satuan,
        harga_total: item.harga_total,
        nama_toko: item.nama_toko,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=data-barang.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
    // return res.status(201).json({
    //   message: "Transaksi successfully fetched",
    //   data: transaksi,
    // });
  } catch (error) {
    return res.status(500).send([
      {
        code: "E-007",
        message: error.message,
      },
    ]);
  }
};

const handleUpdateBarang = async (req, res) => {
  // Mulai transaction
  const t = await sequelize.transaction();

  try {
    const { oldBarcode } = req.params;
    const { barcode, nama_barang, stok, satuan } = req.body;

    // Cek semua body tidak boleh empty string
    if (
      barcode === "" ||
      nama_barang === "" ||
      stok === null ||
      satuan === ""
    ) {
      await t.rollback();
      return res.status(400).send({
        code: "E-400",
        message: "Field tidak boleh kosong",
      });
    }

    // Cek kalau stok minus
    if (stok < 0) {
      await t.rollback();
      return res.status(400).send({
        code: "E-200",
        message: "Stok tidak boleh minus",
      });
    }

    // Cari barang lama
    const barang = await Barang.findByPk(oldBarcode, { transaction: t });
    if (!barang) {
      await t.rollback();
      return res.status(404).json({
        code: "E-404",
        message: `Barang dengan barcode ${oldBarcode} tidak ditemukan`,
      });
    }

    const newStock = stok ?? barang.stok;

    // Jika admin mengubah barcode
    if (barcode && barcode !== oldBarcode) {
      // Cek apakah barcode baru sudah ada
      const barangCheck = await Barang.findByPk(barcode, { transaction: t });
      if (barangCheck) {
        await t.rollback();
        return res.status(400).json({
          code: "E-008",
          message: `Barcode ${barcode} sudah digunakan di barang ${barangCheck.nama_barang}`,
        });
      }

      // Update semua transaksi yang menggunakan barcode lama ke barcode baru
      await TransaksiPembelian.update(
        { barcode_barang: barcode },
        { where: { barcode_barang: oldBarcode }, transaction: t }
      );

      // Update semua request detail yang menggunakan barcode lama ke barcode baru
      await Request_Detail.update(
        { barcode_barang: barcode },
        { where: { barcode_barang: oldBarcode }, transaction: t }
      );
    }

    let newImageUrl = barang.foto;
    let imagePublicId = barang.foto_public_id;
    if (req.file) {
      const uploadResult = await uploadImageToCloudinary(req.file);
      newImageUrl = uploadResult.url;
      const newImagePublicId = uploadResult.publicId;

      if (imagePublicId) await deleteImageFromCloudinary(imagePublicId);

      imagePublicId = newImagePublicId;
    }

    // Update data barang
    await Barang.update(
      {
        barcode: barcode,
        nama_barang,
        stok: newStock,
        satuan,
        foto: newImageUrl,
        foto_public_id: imagePublicId,
      },
      { where: { barcode: oldBarcode }, transaction: t }
    );

    // Commit transaction
    await t.commit();

    // Ambil data terbaru dengan relasi
    const updatedBarang = await Barang.findByPk(barcode, {
      include: [{ model: TransaksiPembelian }],
    });

    return res.status(200).json({
      message: "Berhasil memperbarui barang",
      data: updatedBarang,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({
      code: "E-007",
      message: error.message,
    });
  }
};

const handleGetAllBarang = async (req, res) => {
  try {
    const barang = await Barang.findAll({ order: [["stok", "DESC"]] });
    return res.status(200).json({
      message: "Successfully get all barang",
      data: barang,
    });
  } catch (error) {
    return res.status(500).send([
      {
        code: "E-009",
        message: error.message,
      },
    ]);
  }
};

const handleGetBarangByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const barang = await Barang.findByPk(barcode, {
      include: [
        {
          model: TransaksiPembelian,
        },
        {
          model: Request_Detail,
        },
      ],
    });
    if (!barang) {
      return res.status(404).send([
        {
          code: "E-010",
          message: "Barang not found",
        },
      ]);
    }
    return res.status(200).json({
      message: "Successfully get barang",
      data: barang,
    });
  } catch (error) {
    return res.status(500).send([
      {
        code: "E-011",
        message: error.message,
      },
    ]);
  }
};

const handleDeleteBarang = async (req, res) => {
  try {
    const { barcode } = req.params;
    const barang = await Barang.findByPk(barcode);
    if (!barang) {
      return res.status(404).send([
        {
          code: "E-010",
          message: "Barang not found",
        },
      ]);
    }
    await barang.destroy();
    return res.status(200).json({
      message: "Successfully delete barang",
    });
  } catch (error) {
    return res.status(500).send([
      {
        code: "E-011",
        message: error.message,
      },
    ]);
  }
};

const handleGetAllBarangForRequest = async (req, res) => {
  try {
    const barang = await Barang.findAll({
      where: {
        stok: {
          [Op.gt]: 0,
        },
      },
    });
    return res.status(200).json({
      message: "Successfully get all barang",
      data: barang,
    });
  } catch (error) {
    return res.status(500).send([
      {
        code: "E-009",
        message: error.message,
      },
    ]);
  }
};

const uploadImageToCloudinary = async (file) => {
  try {
    const fileBase64 = file.buffer.toString("base64");
    const fileData = `data:${file.mimetype};base64,${fileBase64}`;
    const result = await cloudinary.uploader.upload(fileData);

    // const result = await cloudinary.uploader.upload(file.buffer, {
    //   folder: "barang_images", // Menyimpan gambar dalam folder 'barang_images' di Cloudinary
    //   resource_type: "image",
    // });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    }; // Mengembalikan URL gambar yang telah diupload
  } catch (error) {
    throw new Error("Upload gambar ke Cloudinary gagal");
  }
  // const fileBase64 = req.file.buffer.toString("base64");
  // const file = `data:${req.file.mimetype};base64,${fileBase64}`;

  // const data = cloudinary.uploader.upload(file, (err, result) => {
  //   if (err) {
  //     return false;
  //   }
  //   return result.url;
  // });
  // return data;
};

const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn("Gagal menghapus gambar lama dari Cloudinary:", error.message);
  }
};

module.exports = {
  handleGetUser,
  handleAddTransaksi,
  handleGetAllTransaksiByBarcode,
  handleCreateBarang,
  handleGetAllTransaksi,
  handleUpdateBarang,
  handleGetAllBarang,
  handleGetAllBarangForRequest,
  handleGetBarangByBarcode,
  handleDeleteBarang,
  handleDeleteTransaksiById,
};
