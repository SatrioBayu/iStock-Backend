"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Barangs", {
      barcode: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      nama_barang: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      stok: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      satuan: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      foto: {
        type: Sequelize.STRING,
      },
      foto_public_id: {
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
    await queryInterface.dropTable("Barangs");
  },
};
