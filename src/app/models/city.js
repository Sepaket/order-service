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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  const City = sequelize.define('City', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'cities',
  });

  City.associate = (model) => {
    model.City.belongsTo(model.Province, {
      as: 'province',
    });

    model.City.hasMany(model.District, {
      as: 'district',
      foreignKey: 'cityId',
    });

    model.City.hasMany(model.SubDistrict, {
      as: 'subDistrict',
      foreignKey: 'cityId',
    });
  };

  return City;
};
