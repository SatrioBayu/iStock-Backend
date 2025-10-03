"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class TransaksiPembelian extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TransaksiPembelian.belongsTo(models.Barang, {
        foreignKey: "barcode_barang",
        targetKey: "barcode",
      });
    }
  }
  TransaksiPembelian.init(
    {
      barcode_barang: DataTypes.STRING,
      tanggal_transaksi: DataTypes.DATE,
      jumlah_dibeli: DataTypes.INTEGER,
      harga_satuan: DataTypes.INTEGER,
      harga_total: DataTypes.INTEGER,
      nama_toko: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "TransaksiPembelian",
    }
  );
  return TransaksiPembelian;
};
