"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Request.hasMany(models.Request_Detail, {
        foreignKey: "id_request",
        sourceKey: "id",
      });
    }
  }
  Request.init(
    {
      kode_request: DataTypes.STRING,
      nama_bagian: DataTypes.STRING,
      nama_pemohon: DataTypes.STRING,
      tanggal_request: DataTypes.DATE,
      tanggal_disetujui: DataTypes.DATE,
      tanggal_ditolak: DataTypes.DATE,
      tanggal_selesai: DataTypes.DATE,
      status_request: DataTypes.STRING,
      catatan_pemohon: DataTypes.STRING,
      catatan_penyetuju: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Request",
    }
  );
  Request.beforeCreate(async (request, options) => {
    const date = request.tanggal_request || new Date();
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    // Hitung jumlah request pada tanggal ini
    const [[{ count }]] = await sequelize.query(`
      SELECT COUNT(*)::int as count
      FROM "Requests"
      WHERE DATE("tanggal_request") = '${yyyy}-${mm}-${dd}'
    `);

    const nomorUrut = String(count + 1).padStart(3, "0");
    request.kode_request = `FORM-${dd}-${mm}-${yyyy}-${nomorUrut}`;
  });
  return Request;
};
