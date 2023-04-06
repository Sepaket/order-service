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
    orderCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resi: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    expedition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serviceCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isCod: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    orderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    orderTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    podStatus: {
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

  const Order = sequelize.define('Order', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'orders',
  });

  Order.associate = (model) => {
    model.Order.hasOne(model.OrderDetail, {
      as: 'detail',
      foreignKey: 'orderId',
    });

    model.Order.hasOne(model.Ticket, {
      as: 'ticket',
      foreignKey: 'orderId',
    });

    model.Order.hasOne(model.OrderAddress, {
      as: 'receiverAddress',
      foreignKey: 'orderId',
    });


    // model.Order.belongsTo(model.Seller, {
    //   as: 'seller',
    //   through: 'detail'
    // });

    model.Order.hasOne(model.OrderBackground, {
      as: 'background',
      sourceKey: 'resi',
      foreignKey: 'resi',
    });

    model.Order.hasOne(model.OrderHistory, {
      as: 'history',
      foreignKey: 'orderId',
    });


    model.Order.hasMany(model.OrderLog, {
      as: 'statuses',
      foreignKey: 'orderId',
    });
  };

  return Order;
};
