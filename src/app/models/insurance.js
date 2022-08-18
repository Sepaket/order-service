module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    expedition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    insuranceValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    insuranceValueType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    adminFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    adminFeeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  };

  const Insurance = sequelize.define('Insurance', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'insurances',
  });

  return Insurance;
};
