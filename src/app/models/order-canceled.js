module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    parameter: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    isExecute: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    expedition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  return sequelize.define('OrderCanceled', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'order_canceleds',
  });
};
