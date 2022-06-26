module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    resi: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expedition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serviceCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isCod: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    orderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    orderTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
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

  const Order = sequelize.define('Order', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'orders',
  });

  Order.associate = (model) => {
    model.Order.hasOne(model.OrderDetail, {
      as: 'detail',
      foreignKey: 'orderId',
    });
  };

  return Order;
};
