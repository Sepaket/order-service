module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    resi: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expedition: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  };

  const AwbList = sequelize.define('AwbList', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'awb_list',
  });

  AwbList.associate = (model) => {
    model.AwbList.belongsTo(model.Order, {
      as: 'order',
    });
  };

  return AwbList;
};
