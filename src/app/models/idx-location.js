module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    province_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    province_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    city_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    district_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    district_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  return sequelize.define('IdxLocation', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'idx_locations',
  });
};
