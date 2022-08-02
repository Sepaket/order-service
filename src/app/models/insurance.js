module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    expedition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    insurance_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    insurance_value_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    admin_fee_type: {
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

  const Insurance = sequelize.define('Insurance', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'insurances',
  });

  return Insurance;
};
