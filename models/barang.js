"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Barang extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Barang.hasMany(models.TransaksiPembelian, {
        foreignKey: "barcode_barang",
        sourceKey: "barcode",
      });
      Barang.hasMany(models.Request_Detail, {
        foreignKey: "barcode_barang",
        sourceKey: "barcode",
      });
    }
  }
  Barang.init(
    {
      barcode: { type: DataTypes.STRING, primaryKey: true },
      nama_barang: DataTypes.STRING,
      stok: DataTypes.INTEGER,
      satuan: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Barang",
    }
  );
  return Barang;
};
