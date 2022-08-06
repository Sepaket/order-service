module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    externalId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provider: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    topup: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    withdraw: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requestPayload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    responsePayload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  };

  const Credit = sequelize.define('CreditHistory', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'credit_histories',
  });

  Credit.associate = (model) => {
    model.CreditHistory.belongsTo(model.SellerDetail, {
      as: 'seller',
    });
  };

  return Credit;
};
