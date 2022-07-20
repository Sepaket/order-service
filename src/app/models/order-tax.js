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
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    taxType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vatTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    vatType: {
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

  const OrderTax = sequelize.define('OrderTax', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'order_taxes',
  });

  OrderTax.associate = (model) => {
    model.OrderTax.belongsTo(model.OrderDetail, {
      as: 'orderDetail',
      foreignKey: 'orderId',
      targetKey: 'orderId',
    });
  };

  return OrderTax;
};
