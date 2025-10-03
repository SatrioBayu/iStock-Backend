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
      "Admins",
      [
        {
          username: "fariz",
          password: "123", // hash password
          nama: "Andy Alfariz",
          role: "Pengelola BMN",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: "hasbi",
          password: "123",
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
