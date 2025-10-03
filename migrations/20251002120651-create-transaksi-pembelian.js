"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TransaksiPembelians", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      barcode_barang: {
        type: Sequelize.STRING,
        references: {
          model: "Barangs",
          key: "barcode",
        },
      },
      tanggal_transaksi: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      jumlah_dibeli: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      harga_satuan: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      harga_total: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      nama_toko: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("TransaksiPembelians");
  },
};
