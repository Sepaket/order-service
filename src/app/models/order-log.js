module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previousStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currentStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    podStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
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
    resi: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deltaCredit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expedition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    serviceCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  };

  const OrderLog = sequelize.define('OrderLog', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'order_logs',
  });

  return OrderLog;
};
