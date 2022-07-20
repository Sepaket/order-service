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
    discountSeller: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    discountSellerType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    discountProvider: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    discountProviderType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    discountGlobal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    discountGlobalType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'this discount get from admin when admin set discount fee',
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

  const OrderDiscount = sequelize.define('OrderDiscount', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'order_discounts',
  });

  OrderDiscount.associate = (model) => {
    model.OrderDiscount.belongsTo(model.OrderDetail, {
      as: 'orderDetail',
      foreignKey: 'orderId',
      targetKey: 'orderId',
    });
  };

  return OrderDiscount;
};
