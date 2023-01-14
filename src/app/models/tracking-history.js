module.exports = (sequelize, DataTypes) => {
  const schema = {
    orderId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    cnoteRaw: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    detailRaw: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    historyRaw: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cnotePodDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cnotePodStatus: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cnotePodCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cnoteLastStatus: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cnoteEstimateDelivery: {
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

  const TrackingHistory = sequelize.define('TrackingHistory', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'tracking_histories',
  });

  TrackingHistory.associate = (model) => {
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

  return TrackingHistory;
};
