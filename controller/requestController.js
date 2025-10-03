const { sequelize, Request, Request_Detail, Barang } = require("../models");

const handleAddRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nama_pemohon, barang } = req.body;

    // Buat request utama
    const newRequest = await Request.create(
      {
        nama_pemohon,
        tanggal_request: new Date(),
        status_request: "Menunggu Persetujuan",
      },
      { transaction: t }
    );

    // Buat detail request
    const newRequestDetail = await Promise.all(
      barang.map((item) =>
        Request_Detail.create(
          {
            id_request: newRequest.id,
            barcode_barang: item.barcode,
            jumlah: item.jumlah,
          },
          { transaction: t }
        )
      )
    );

    // Commit transaksi
    await t.commit();

    return res.status(201).send({
      message: "Request berhasil dibuat",
      data: {
        request: newRequest,
        details: newRequestDetail,
      },
    });
  } catch (error) {
    // Rollback kalau ada error
    await t.rollback();
    return res.status(500).send({
      code: "E-007",
      message: error.message,
    });
  }
};

const handleGetAllRequest = async (req, res) => {
  try {
    const requests = await Request.findAll({
      include: [
        {
          model: Request_Detail,
          include: [
            {
              model: Barang,
            },
          ],
        },
      ],
      order: [["tanggal_request", "DESC"]],
    });

    return res.status(200).json({
      message: "Data request berhasil diambil",
      data: requests,
    });
  } catch (error) {
    return res.status(500).send({
      code: "E-007",
      message: error.message,
    });
  }
};

const handleGetRequestByKode = async (req, res) => {
  try {
    const { kode_request } = req.params;
    const request = await Request.findOne({
      where: {
        kode_request,
      },
      include: [
        {
          model: Request_Detail,
          include: [
            {
              model: Barang,
            },
          ],
        },
      ],
      order: [["tanggal_request", "DESC"]],
    });
    return res.status(200).json({
      message: "Data request berhasil diambil",
      data: request,
    });
  } catch (error) {
    return res.status(500).send({
      code: "E-007",
      message: error.message,
    });
  }
};

const handleApproved = async (req, res) => {
  try {
    const { kode_request } = req.params;
    const formRequest = await Request.findOne({
      where: {
        kode_request,
      },
    });
    if (!formRequest) {
      return res.status(404).send([
        {
          code: "E-006",
          message: "Request tidak ditemukan",
        },
      ]);
    }
    await formRequest.update({
      tanggal_disetujui: new Date(),
      status_request: "Disetujui",
    });

    return res.status(200).json({
      message: "Request has been approved",
      data: formRequest,
    });
  } catch (error) {
    return res.status(500).send({
      code: "E-007",
      message: error.message,
    });
  }
};

const handleReject = async (req, res) => {
  try {
    const { kode_request } = req.params;
    const formRequest = await Request.findOne({
      where: {
        kode_request,
      },
    });
    if (!formRequest) {
      return res.status(404).send([
        {
          code: "E-006",
          message: "Request tidak ditemukan",
        },
      ]);
    }
    await formRequest.update({
      tanggal_disetujui: new Date(),
      status_request: "Ditolak",
    });

    return res.status(200).json({
      message: "Request has been rejected",
      data: formRequest,
    });
  } catch (error) {
    return res.status(500).send({
      code: "E-007",
      message: error.message,
    });
  }
};

const handleFinish = async (req, res) => {
  const { kode_request } = req.params;
  const t = await sequelize.transaction();
  try {
    const request = await Request.findOne({
      where: { kode_request },
      include: [{ model: Request_Detail }],
      transaction: t,
    });

    if (!request) {
      return res.status(404).json({ message: "Request tidak ditemukan" });
    }

    if (request.status_request !== "Disetujui") {
      return res
        .status(400)
        .json({ message: "Request hanya bisa diselesaikan setelah disetujui" });
    }

    // update stok barang
    for (const detail of request.Request_Details) {
      const barang = await Barang.findByPk(detail.barcode_barang, {
        transaction: t,
      });
      if (!barang) continue;

      if (barang.stok < detail.jumlah) {
        await t.rollback();
        return res.status(400).json({
          message: `Stok barang ${barang.nama_barang} tidak mencukupi`,
        });
      }

      barang.stok -= detail.jumlah;
      await barang.save({ transaction: t });
    }

    // update status request
    request.status_request = "Selesai";
    request.tanggal_selesai = new Date();
    await request.save({ transaction: t });

    await t.commit();

    return res
      .status(200)
      .json({ message: "Request berhasil diselesaikan", data: request });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  handleAddRequest,
  handleGetAllRequest,
  handleGetRequestByKode,
  handleApproved,
  handleReject,
  handleFinish,
};
