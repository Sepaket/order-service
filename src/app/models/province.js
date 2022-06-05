module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  const Province = sequelize.define('Province', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'provinces',
  });

  Province.associate = (model) => {
    model.Province.hasMany(model.City, {
      as: 'city',
      foreignKey: 'provinceId',
    });

    model.Province.hasMany(model.District, {
      as: 'district',
      foreignKey: 'provinceId',
    });

    model.Province.hasMany(model.SubDistrict, {
      as: 'subDistrict',
      foreignKey: 'provinceId',
    });
  };

  return Province;
};
