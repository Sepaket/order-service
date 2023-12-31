module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    photo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    credit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    bankId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bankAccountName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bankAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referalCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    codFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    codFeeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    discountType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rateReferal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    rateReferalType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referredSellerId: {
      type: DataTypes.INTEGER,
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

  const SellerDetail = sequelize.define('SellerDetail', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'seller_details',
  });

  SellerDetail.associate = (model) => {
    model.SellerDetail.belongsTo(model.Seller, {
      as: 'seller',
    });

    model.SellerDetail.belongsTo(model.Seller, {
      as: 'referred',
      foreignKey: 'referredSellerId',
    });


    model.SellerDetail.belongsTo(model.Bank, {
      as: 'bank',
    });

    model.SellerDetail.hasMany(model.CreditHistory, {
      as: 'creditHistories',
      foreignKey: 'sellerId',
    });
  };

  return SellerDetail;
};
