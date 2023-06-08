const { Model, DataTypes } = require("sequelize");
const sequelize = require("../database/db_config");
const UsersModel = require("./users");

class Report extends Model {}

Report.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: UsersModel,
        key: "id",
      },
    },
    judul: {
      type: DataTypes.STRING,
    },
    gambar: {
      type: DataTypes.TEXT,
    },
    lokasi: {
      type: DataTypes.STRING,
    },
    desc: {
      type: DataTypes.STRING,
    },
    akurasi: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "reports",
  }
);

Report.belongsTo(UsersModel, { foreignKey: "user_id" });

module.exports = Report;