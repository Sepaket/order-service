module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    provinceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    districtId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  const SubDistrict = sequelize.define('SubDistrict', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'sub_districts',
  });

  SubDistrict.associate = (model) => {
    model.SubDistrict.belongsTo(model.Province, {
      as: 'province',
    });

    model.SubDistrict.belongsTo(model.City, {
      as: 'city',
    });

    model.SubDistrict.belongsTo(model.District, {
      as: 'district',
    });
  };

  return SubDistrict;
};
