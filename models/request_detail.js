"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Request_Detail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Request_Detail.belongsTo(models.Barang, {
        foreignKey: "barcode_barang",
        targetKey: "barcode",
      });
      Request_Detail.belongsTo(models.Request, {
        foreignKey: "id_request",
        targetKey: "id",
      });
    }
  }
  Request_Detail.init(
    {
      id_request: DataTypes.INTEGER,
      barcode_barang: DataTypes.STRING,
      jumlah: DataTypes.INTEGER,
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Request_Detail",
    }
  );
  return Request_Detail;
};
