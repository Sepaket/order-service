module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    resi: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    request: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    response: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  };

  const OrderFailed = sequelize.define('OrderFailed', schema, {
    timestamps: true,
    paranoid: true,
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
