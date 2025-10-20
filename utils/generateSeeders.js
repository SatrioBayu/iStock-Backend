const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

async function generateSeeder() {
  try {
    // Pastikan path ke file Excel benar relatif terhadap lokasi file ini
    const excelPath = path.resolve(__dirname, "../src/template/dataAwal.xlsx");
    console.log("📁 Membaca file:", excelPath);

    // Baca workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    const sheet = workbook.worksheets[0]; // ambil sheet pertama

    const rows = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const barcode = row.getCell(1).value;
      const nama_barang = row.getCell(2).value;
      const satuan = row.getCell(3).value;
      const stok = Number(row.getCell(4).value);

      rows.push({
        barcode,
        nama_barang,
        satuan,
        stok,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Template seeder Sequelize
    const seederTemplate = `"use strict";

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Barangs", ${JSON.stringify(
      rows,
      null,
      2
    )}, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Barangs", null, {});
  }
};
`;

    // Simpan file hasil seeder
    const outputPath = path.resolve(
      __dirname,
      "../seeders/20251017-barang-seeder.js"
    );
    fs.writeFileSync(outputPath, seederTemplate);

    console.log(`✅ Seeder berhasil dibuat di: ${outputPath}`);
  } catch (err) {
    console.error("❌ Gagal membuat seeder:", err.message);
  }
}

generateSeeder();
