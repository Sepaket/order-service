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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  const District = sequelize.define('District', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'districts',
  });

  District.associate = (model) => {
    model.District.belongsTo(model.Province, {
      as: 'province',
    });

    model.District.belongsTo(model.City, {
      as: 'city',
    });

    model.District.hasMany(model.SubDistrict, {
      as: 'subDistrict',
      foreignKey: 'districtId',
    });
  };

  return District;
};
