"use strict";

const bcrypt = require("bcrypt");

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

    const hashedPassword = await bcrypt.hash("pttunmks123", 10);

    await queryInterface.bulkInsert(
      "Admins",
      [
        {
          username: "fariz",
          password: hashedPassword, // hash password
          nama: "Andy Alfariz",
          role: "Pengelola BMN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "hasbi",
          password: hashedPassword,
          nama: "Andi Nurhasbi",
          role: "Kasubbag TURT",
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
    await queryInterface.bulkDelete("Admins", null, {});
  },
};
