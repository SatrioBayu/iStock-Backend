"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Requests", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      kode_request: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nama_pemohon: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nama_bagian: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tanggal_request: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      tanggal_disetujui: {
        type: Sequelize.DATE,
      },
      tanggal_ditolak: {
        type: Sequelize.DATE,
      },
      tanggal_selesai: {
        type: Sequelize.DATE,
      },
      status_request: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      catatan_pemohon: {
        type: Sequelize.STRING,
      },
      catatan_penyetuju: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("Requests");
  },
};
