module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    district: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    locationCode_1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    locationCode_2: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  return sequelize.define('NinjaLocation', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'ninja_locations',
  });
};
