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
    order_id: {
      type: DataTypes.INTEGER,
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

  const AwbList = sequelize.define('AwbList', schema, {
    timestamps: false,
    paranoid: true,
    underscored: false,
    freezeTableName: false,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'awb_list',
  });

  AwbList.associate = (model) => {
    model.AwbList.belongsTo(model.Order, {
      as: 'order',
      targetKey: 'id',
      foreignKey: 'order_id',
    });
  };

  return AwbList;
};
