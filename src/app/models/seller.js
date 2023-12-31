module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    socialId: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    forgotPasswordToken: {
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

  const Seller = sequelize.define('Seller', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'sellers',
  });

  Seller.associate = (model) => {
    model.Seller.hasOne(model.SellerDetail, {
      as: 'sellerDetail',
      foreignKey: 'sellerId',
    });
    model.Seller.hasOne(model.SellerDetail, {
      as: 'referredDetail',
      foreignKey: 'sellerId',
    });
    // model.Seller.belongsTo(model.Seller, {
    //   as: 'referred',
    //   through: 'sellerDetail',
    //   foreignKey: 'id'
    // });


    model.Seller.hasOne(model.SellerAddress, {
      as: 'address',
      foreignKey: 'sellerId',
    });

    model.Seller.hasOne(model.OrderBatch, {
      as: 'batch',
      foreignKey: 'sellerId',
    });

    model.Seller.hasMany(model.OrderDetail, {
      as: 'orderDetail',
      foreignKey: 'sellerId',
    });

    model.Seller.hasOne(model.Ticket, {
      as: 'ticket',
      foreignKey: 'sellerId',
    });
    model.Seller.hasMany(model.CreditHistory, {
      as: 'creditHistory',
      foreignKey: 'sellerId',
    });

    // model.Seller.hasMany(model.Order, {
    //   as: 'order',
    //   foreignKey: 'sellerId',
    // });

  };

  return Seller;
};
