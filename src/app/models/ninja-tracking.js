module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    shipperId: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trackingRefNo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shipperRefNo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shipperOrderRefNo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    previousStatus: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trackingId: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    raw: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    previousSize: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newSize: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    previousMeasurements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newMeasurements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    previousWeight: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    newWeight: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    webhookRequestId: {
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

  const NinjaTracking = sequelize.define('NinjaTracking', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'ninja_tracking',
  });

  NinjaTracking.associate = (model) => {
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

  return NinjaTracking;
};
