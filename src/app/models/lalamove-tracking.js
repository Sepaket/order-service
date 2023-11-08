module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    trackingUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rawPayload: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rawResponse: {
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

  const LalamoveTracking = sequelize.define('LalamoveTracking', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'lalamove_tracking',
  });

  LalamoveTracking.associate = (model) => {
    // model.OrderHistory.belongsTo(model.OrderDetail, {
    //   as: 'orderDetail',
    //   foreignKey: 'orderId',
    //   targetKey: 'orderId',
    // });
    // //
    // // model.OrderHistory.belongsTo(model.SellerDetail, {
    // //   through: OrderHistory
    // //   as: 'orderDetail',
    // //   foreignKey: 'orderId',
    // //   targetKey: 'orderId',
    // // });


  };

  return LalamoveTracking;
};
