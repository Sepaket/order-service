module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    codFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    codFeeType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rateReferal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    rateReferalType: {
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

  const TransactionFee = sequelize.define('TransactionFee', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'transaction_fees',
  });

  return TransactionFee;
};
