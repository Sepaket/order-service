module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    trackingRefNo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    raw: {
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
