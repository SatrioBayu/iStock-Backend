const { sequelize, Request, Request_Detail, Barang } = require("../models");
const path = require("path");
const fs = require("fs");
const DocxTemplater = require("docxtemplater");
const PizZip = require("pizzip");
const dayjs = require("dayjs");
const sendWhatsAppNotification = require("../utils/sendWhatsapp");
const ExcelJS = require("exceljs");
const AdmZip = require("adm-zip");

const handleAddRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nama_pemohon, nama_bagian, barang, catatan_pemohon } = req.body;

    if (nama_pemohon === "" || nama_bagian === "" || barang.length === 0) {
      await t.rollback();
      return res.status(400).send({
        code: "E-400",
        message: "Field tidak boleh kosong",
      });
    }

    // Buat request utama
    const newRequest = await Request.create(
      {
        nama_pemohon,
        nama_bagian,
        tanggal_request: new Date(),
        status_request: "Menunggu Persetujuan",
        catatan_pemohon,
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

    // Ambil data request yang sudah dibuat beserta detailnya
    const createdRequest = await Request.findOne({
      where: { id: newRequest.id },
      include: [{ model: Request_Detail }],
      transaction: t,
    });

    // Update stok barang
    for (const detail of createdRequest.Request_Details) {
      const barangItem = await Barang.findByPk(detail.barcode_barang, {
        transaction: t,
      });
      if (!barangItem) {
        await t.rollback();
        return res.status(404).json({
          code: "E-009",
          message: `Barang dengan barcode ${detail.barcode_barang} tidak ditemukan`,
        });
      }

      if (barangItem.stok < detail.jumlah) {
        await t.rollback();
        return res.status(400).json({
          code: "E-010",
          message: `Jumlah yang diajukan melebihi stok barang yang tersedia`,
        });
      }

      barangItem.stok -= detail.jumlah;
      await barangItem.save({ transaction: t });
    }

    // Commit transaksi
    await t.commit();

    // Opsional
    // await sendWhatsAppNotification({
    //   to: "6285943518120",
    //   message: `Halo *Admin*, \n\nAda request baru dari ${newRequest.nama_pemohon} dengan kode request ${newRequest.kode_request}.\n\nSilakan cek aplikasi iStock untuk detailnya.
    //   \nTerima kasih.`,
    // });

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
  const t = await sequelize.transaction();
  try {
    const { kode_request } = req.params;
    const formRequest = await Request.findOne({
      where: {
        kode_request,
      },
      include: [{ model: Request_Detail }],
      transaction: t,
    });
    if (!formRequest) {
      return res.status(404).send([
        {
          code: "E-006",
          message: "Request tidak ditemukan",
        },
      ]);
    }
    await formRequest.update(
      {
        tanggal_ditolak: new Date(),
        status_request: "Ditolak",
      },
      { transaction: t }
    );

    // Kembalikan stok barang
    for (const detail of formRequest.Request_Details) {
      const barang = await Barang.findByPk(detail.barcode_barang, {
        transaction: t,
      });
      if (!barang) continue;
      barang.stok += detail.jumlah;
      await barang.save({ transaction: t });
    }
    await t.commit();

    return res.status(200).json({
      message: "Request has been rejected",
      data: formRequest,
    });
  } catch (error) {
    await t.rollback();
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

    if (request.status_request !== "Dalam Proses") {
      return res
        .status(400)
        .json({ message: "Request hanya bisa diselesaikan setelah disetujui" });
    }

    // // update stok barang
    // for (const detail of request.Request_Details) {
    //   const barang = await Barang.findByPk(detail.barcode_barang, {
    //     transaction: t,
    //   });
    //   if (!barang) continue;

    //   if (barang.stok < detail.jumlah) {
    //     await t.rollback();
    //     return res.status(400).json({
    //       message: `Stok barang ${barang.nama_barang} tidak mencukupi`,
    //     });
    //   }

    //   barang.stok -= detail.jumlah;
    //   await barang.save({ transaction: t });
    // }

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

// const handleApprovalUpdate = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const { kode_request } = req.params;
//     const {
//       approvedItems = [],
//       rejectedItems = [],
//       catatan_penyetuju,
//     } = req.body;

//     // 🔹 1. Ambil request utama dan detailnya
//     const request = await Request.findOne({
//       where: { kode_request },
//       include: [
//         {
//           model: Request_Detail,
//           include: [{ model: Barang }],
//         },
//       ],
//       transaction: t,
//     });

//     if (!request) {
//       await t.rollback();
//       return res.status(404).json({
//         code: "E-006",
//         message: "Request tidak ditemukan",
//       });
//     }

//     // 🔹 2. Update status detail yang disetujui
//     if (approvedItems.length > 0) {
//       await Request_Detail.update(
//         { status: "Disetujui" },
//         { where: { id: approvedItems }, transaction: t }
//       );
//     }

//     // 🔹 3. Update status detail yang ditolak
//     if (rejectedItems.length > 0) {
//       // Ambil data detail yang ditolak untuk mengembalikan stok
//       const rejectedDetails = await Request_Detail.findAll({
//         where: { id: rejectedItems },
//         include: [{ model: Barang }],
//         transaction: t,
//       });

//       // Kembalikan stok barang
//       for (const detail of rejectedDetails) {
//         const barang = detail.Barang;
//         if (barang) {
//           await barang.update(
//             { stok: barang.stok + detail.jumlah },
//             { transaction: t }
//           );
//         }
//       }

//       await Request_Detail.update(
//         { status: "Ditolak" },
//         { where: { id: rejectedItems }, transaction: t }
//       );
//     }

//     // 🔹 4. Update status global request
//     //    - Jika awalnya "Menunggu Persetujuan" → jadi "Dalam Proses"
//     if (request.status_request === "Menunggu Persetujuan") {
//       await request.update(
//         {
//           status_request: "Dalam Proses",
//           tanggal_disetujui: new Date(),
//           catatan_penyetuju,
//         },
//         { transaction: t }
//       );
//     }

//     await t.commit();

//     return res.status(200).json({
//       message: "Status request berhasil diperbarui",
//       data: {
//         kode_request,
//         status_request: "Dalam Proses",
//         approvedItems,
//         rejectedItems,
//       },
//     });
//   } catch (error) {
//     await t.rollback();
//     return res.status(500).json({
//       code: "E-007",
//       message: error.message,
//     });
//   }
// };

const handleApprovalUpdate = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { kode_request } = req.params;
    const {
      approvedItems = [],
      rejectedItems = [],
      catatan_penyetuju,
    } = req.body;

    // 1️⃣ Ambil request utama dan detailnya
    const request = await Request.findOne({
      where: { kode_request },
      include: [{ model: Request_Detail, include: [{ model: Barang }] }],
      transaction: t,
    });

    if (!request) {
      await t.rollback();
      return res.status(404).json({
        code: "E-006",
        message: "Request tidak ditemukan",
      });
    }

    // 2️⃣ Update status detail yang disetujui (bisa sebagian)
    for (const item of approvedItems) {
      const detail = request.Request_Details.find((d) => d.id === item.id);
      if (!detail) continue;

      let status = "Disetujui";
      if (item.jumlahDisetujui < detail.jumlah && item.jumlahDisetujui > 0) {
        status = "Disetujui Sebagian"; // optional label, bisa simpan "Disetujui" saja
      }

      await detail.update(
        {
          status,
          jumlah_disetujui: item.jumlahDisetujui, // pastikan kolom ini ada di DB
        },
        { transaction: t }
      );

      // Kurangi stok barang sesuai jumlahDisetujui
      const barang = detail.Barang;
      if (barang && item.jumlahDisetujui > 0) {
        const stokAkhir = detail.jumlah + barang.stok - item.jumlahDisetujui;
        await barang.update({ stok: stokAkhir }, { transaction: t });
      }
    }

    // 3️⃣ Update status detail yang ditolak
    if (rejectedItems.length > 0) {
      const rejectedDetails = await Request_Detail.findAll({
        where: { id: rejectedItems },
        include: [{ model: Barang }],
        transaction: t,
      });

      for (const detail of rejectedDetails) {
        const barang = detail.Barang;
        if (barang) {
          await barang.update(
            { stok: barang.stok + detail.jumlah },
            { transaction: t }
          );
        }
        await detail.update(
          { status: "Ditolak", jumlah_disetujui: 0 },
          { transaction: t }
        );
      }
    }

    // 4️⃣ Update status global request
    if (request.status_request === "Menunggu Persetujuan") {
      await request.update(
        {
          status_request: "Dalam Proses",
          tanggal_disetujui: new Date(),
          catatan_penyetuju,
        },
        { transaction: t }
      );
    }

    await t.commit();

    return res.status(200).json({
      message: "Status request berhasil diperbarui",
      data: {
        kode_request,
        status_request: "Dalam Proses",
        approvedItems,
        rejectedItems,
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      code: "E-007",
      message: error.message,
    });
  }
};

const handleDownloadRequestByKode = async (req, res) => {
  try {
    const { kode_request } = req.params;
    const request = await Request.findOne({
      where: {
        kode_request,
        status_request: "Selesai",
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
    if (!request) {
      return res.status(404).send([
        {
          code: "E-006",
          message: "Request tidak ditemukan",
        },
      ]);
    }
    // Load the docx file as binary content
    const content = fs.readFileSync(
      path.resolve(__dirname, "../src/template/FORM.docx"),
      "binary"
    );
    const zip = new PizZip(content);
    const doc = new DocxTemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    // Prepare data for the template
    // Buatkan index agar di form docx nya ada nomor urut
    const barangList = request.Request_Details.map((detail, index) => ({
      index: index + 1,
      nama_barang: detail.Barang.nama_barang,
      jumlah: detail.jumlah,
      jumlah_disetujui: detail.jumlah_disetujui,
      status_persetujuan: detail.status,
    }));

    // Set the template variables
    doc.setData({
      kode_request: request.kode_request,
      nama_pemohon: request.nama_pemohon,
      nama_bagian: request.nama_bagian,
      tanggal_request: dayjs(request.tanggal_request).format(
        "DD MMMM YYYY HH:mm:ss"
      ),
      tanggal_disetujui: dayjs(request.tanggal_disetujui).format(
        "DD MMMM YYYY HH:mm:ss"
      ),
      tanggal_selesai: dayjs(request.tanggal_selesai).format(
        "DD MMMM YYYY HH:mm:ss"
      ),
      periode: dayjs(request.tanggal_request).format("MMMM YYYY"),
      tanggal_download: dayjs(new Date()).format("DD MMMM YYYY"),
      status_request: request.status_request,
      barang_list: barangList,
    });
    try {
      // Render the document (replace all occurrences of {first_name} by John, {last_name} by Doe, ...)
      doc.render();
    } catch (error) {
      const e = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        properties: error.properties,
      };
      console.log(JSON.stringify({ error: e }));
      return res.status(500).send({
        code: "E-008",
        message: "Error rendering document",
        details: e,
      });
    }
    const buf = doc.getZip().generate({ type: "nodebuffer" });
    const fileName = `Request_${request.kode_request}.docx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(buf);
  } catch (error) {
    return res.status(500).send({
      code: "E-007",
      message: error.message,
    });
  }
};

const handleDownloadRequestDetail = async (req, res) => {
  try {
    const barangKeluar = await Request_Detail.findAll({
      where: {
        status: "Disetujui",
      },
      include: [
        { model: Barang, attributes: ["nama_barang"] },
        {
          model: Request,
          attributes: ["nama_bagian", "nama_pemohon", "tanggal_selesai"],
        },
      ],
    });

    // Buat workbook dan worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("BARANG KELUAR");

    // Definisikan kolom
    worksheet.columns = [
      { header: "Tanggal dan Jam", key: "tanggal_selesai", width: 20 },
      { header: "Barcode", key: "barcode", width: 20 },
      { header: "Nama Barang", key: "nama_barang", width: 20 },
      { header: "Jumlah Keluar", key: "jumlah_keluar", width: 20 },
      { header: "Nama Bagian", key: "nama_bagian", width: 20 },
      { header: "Keterangan", key: "keterangan", width: 20 },
    ];

    barangKeluar.forEach((item) => {
      worksheet.addRow({
        tanggal_selesai: dayjs(item.Request.tanggal_selesai).format(
          "DD/MM/YYYY HH:mm:ss"
        ),
        barcode: item.barcode_barang,
        nama_barang: item.Barang.nama_barang,
        jumlah_keluar: item.jumlah,
        nama_bagian: item.Request.nama_bagian,
        keterangan: item.Request.nama_pemohon,
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
    // return res.status(200).json({
    //   message: "Barang Masuk successfully fetched",
    //   data: barangKeluar,
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

const handleDownloadAllRequestsAsZip = async (req, res) => {
  try {
    const requests = await Request.findAll({
      where: { status_request: "Selesai" },
      include: [{ model: Request_Detail, include: [Barang] }],
      order: [["tanggal_request", "DESC"]],
    });

    if (!requests || requests.length === 0) {
      return res
        .status(404)
        .send([{ code: "E-006", message: "Tidak ada request ditemukan" }]);
    }

    const zip = new AdmZip();

    for (const request of requests) {
      const content = fs.readFileSync(
        path.resolve(__dirname, "../src/template/FORM.docx"),
        "binary"
      );
      const docZip = new PizZip(content);
      const doc = new DocxTemplater(docZip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const barangList = request.Request_Details.map((detail, index) => ({
        index: index + 1,
        nama_barang: detail.Barang.nama_barang,
        jumlah: detail.jumlah,
        status_persetujuan: detail.status,
      }));

      doc.setData({
        kode_request: request.kode_request,
        nama_pemohon: request.nama_pemohon,
        nama_bagian: request.nama_bagian,
        tanggal_request: dayjs(request.tanggal_request).format(
          "DD MMMM YYYY HH:mm:ss"
        ),
        tanggal_disetujui: dayjs(request.tanggal_disetujui).format(
          "DD MMMM YYYY HH:mm:ss"
        ),
        tanggal_selesai: dayjs(request.tanggal_selesai).format(
          "DD MMMM YYYY HH:mm:ss"
        ),
        periode: dayjs(request.tanggal_request).format("MMMM YYYY"),
        status_request: request.status_request,
        barang_list: barangList,
      });

      doc.render();
      const buf = doc.getZip().generate({ type: "nodebuffer" });
      zip.addFile(`Request_${request.kode_request}.docx`, buf);
    }

    const zipBuffer = zip.toBuffer();
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="All_Requests.zip"`
    );
    return res.send(zipBuffer);
  } catch (error) {
    return res.status(500).send({ code: "E-007", message: error.message });
  }
};

module.exports = {
  handleAddRequest,
  handleGetAllRequest,
  handleGetRequestByKode,
  handleApproved,
  handleReject,
  handleFinish,
  handleDownloadRequestByKode,
  handleApprovalUpdate,
  handleDownloadRequestDetail,
  handleDownloadAllRequestsAsZip,
};
