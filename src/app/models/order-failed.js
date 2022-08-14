module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    batchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  };

  const OrderFailed = sequelize.define('OrderFailed', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'order_faileds',
  });

  OrderFailed.associate = (model) => {
    model.OrderFailed.hasOne(model.Order, {
      as: 'order',
      foreignKey: 'resi',
    });
  };

  return OrderFailed;
};
