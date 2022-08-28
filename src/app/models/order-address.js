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
    senderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    receiverName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    receiverPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    receiverAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    receiverAddressNote: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    receiverLocationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hideInResi: {
      type: DataTypes.BOOLEAN,
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

  const OrderAddress = sequelize.define('OrderAddress', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'order_addresses',
  });

  OrderAddress.associate = (model) => {
    model.OrderAddress.belongsTo(model.Location, {
      as: 'location',
      foreignKey: 'receiverLocationId',
    });
  };

  return OrderAddress;
};
