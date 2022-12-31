module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    batchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sellerAddressId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    weight: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    volume: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalItem: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goodsContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goodsPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    codFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    shippingCharge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    useInsurance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    insuranceAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    isTrouble: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    sellerReceivedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    codFeeAdmin: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    codFeeAdminType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingCalculated: {
      type: DataTypes.DECIMAL(10, 2),
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

  const OrderDetail = sequelize.define('OrderDetail', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'order_details',
  });

  OrderDetail.associate = (model) => {
    model.OrderDetail.belongsTo(model.Order, {
      as: 'order',
    });

    model.OrderDetail.belongsTo(model.Seller, {
      as: 'seller',
    });

    model.OrderDetail.belongsTo(model.SellerAddress, {
      as: 'sellerAddress',
    });

    model.OrderDetail.belongsTo(model.OrderAddress, {
      as: 'receiverAddress',
      targetKey: 'orderId',
      foreignKey: 'orderId',
    });

    model.OrderDetail.hasOne(model.OrderTax, {
      as: 'tax',
      targetKey: 'orderId',
      foreignKey: 'orderId',
    });

      // model.OrderDiscount.belongsTo(model.OrderDetail, {
      //   as: 'orderDetail',
      //   foreignKey: 'orderId',
      //   targetKey: 'orderId',
      // });


    model.OrderDetail.belongsTo(model.OrderDiscount, {
      as: 'discount',
      targetKey: 'orderId',
      foreignKey: 'orderId',
    });



    model.OrderDetail.belongsTo(model.OrderBatch, {
      as: 'batch',
      targetKey: 'id',
      foreignKey: 'batchId',
    });

    // model.OrderDetail.belongsTo(model.OrderHistory, {
    //   as: 'history',
    //   targetKey: 'orderId',
    //   foreignKey: 'orderId',
    // });


  };

  return OrderDetail;
};
