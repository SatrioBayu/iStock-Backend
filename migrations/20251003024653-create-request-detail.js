"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Request_Details", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      id_request: {
        type: Sequelize.INTEGER,
        references: {
          model: "Requests",
          key: "id",
        },
      },
      barcode_barang: {
        type: Sequelize.STRING,
        references: {
          model: "Barangs",
          key: "barcode",
        },
      },
      jumlah: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable("Request_Details");
  },
};
