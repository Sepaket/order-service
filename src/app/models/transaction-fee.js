module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    cod_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    cod_fee_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rate_referal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    rate_referal_type: {
      type: DataTypes.STRING,
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
