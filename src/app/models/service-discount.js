module.exports = (sequelize, DataTypes) => {
  const schema = {
    providerName: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    serviceName: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    discountType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    discountAmount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
    },
  };

  const ServiceDiscount = sequelize.define('ServiceDiscount', schema, {
    timestamps: false,
    // paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'service_discounts',
  });

  return ServiceDiscount;
};
