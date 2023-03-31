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
    resi: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  const OrderBackground =  sequelize.define('OrderBackground', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'order_backgrounds',
  });



  OrderBackground.associate = (model) => {
    model.OrderBackground.belongsTo(model.Order, {
      as: 'order',
      foreignKey: 'resi',
      // targetKey: 'resi',
    });

  };






  return OrderBackground;
};
