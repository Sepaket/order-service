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
      unique: true,
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
    onHold: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    isCod: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    additionalNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    provider: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    referralId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    referralCredit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    referralBonusExecuted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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

    model.OrderHistory.belongsTo(model.Seller, {
      as: 'referred',
      foreignKey: 'referralId',
    });

    // model.OrderHistory.belongsTo(model.Seller, {
    //   as: 'orderSeller',
    //   through: 'orderDetail',
    //   // foreignKey: 'referralId',
    // });



    model.OrderHistory.belongsTo(model.Order, {
      as: 'order',
      foreignKey: 'orderId',
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
