"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert(
      "Barangs",
      [
        {
          barcode: "1010301001-000034",
          nama_barang: "PENSIL 2B",
          stok: 9,
          satuan: "BUAH",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          barcode: "1010301001-000038",
          nama_barang: "PULPEN BALINER ",
          stok: 4,
          satuan: "BUAH",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          barcode: "1010301001-000114",
          nama_barang: "SPIDOL WHITEBOARD ARTLINE",
          stok: 10,
          satuan: "BUAH",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
