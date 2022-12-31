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
    deltaCredit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currentCredit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    isExecute: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
  };

  const OrderHistory = sequelize.define('OrderHistory', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'order_histories',
  });

  OrderHistory.associate = (model) => {
    model.OrderHistory.belongsTo(model.OrderDetail, {
      as: 'orderDetail',
      foreignKey: 'orderId',
      targetKey: 'orderId',
    });
    //
    // model.OrderHistory.belongsTo(model.SellerDetail, {
    //   through: OrderHistory
    //   as: 'orderDetail',
    //   foreignKey: 'orderId',
    //   targetKey: 'orderId',
    // });


  };

  return OrderHistory;
};
