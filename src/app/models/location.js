module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    district: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subDistrict: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jneOriginCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    jneDestinationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sicepatOriginCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sicepatDestinationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ninjaOriginCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ninjaDestinationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idexpressOriginCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idexpressDestinationCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  };

  const Location = sequelize.define('Location', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'locations',
  });

  Location.associate = (model) => {
    model.Location.hasOne(model.SellerAddress, {
      as: 'sellerAddress',
      foreignKey: 'locationId',
    });

    model.Location.hasOne(model.OrderDetail, {
      as: 'sellerOrderAddress',
      foreignKey: 'sellerAddressId',
    });

    model.Location.hasOne(model.OrderAddress, {
      as: 'receiverOrderAddress',
      foreignKey: 'receiverLocationId',
    });
  };

  return Location;
};
