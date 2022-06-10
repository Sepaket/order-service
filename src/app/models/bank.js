module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  };

  const Bank = sequelize.define('Bank', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'banks',
  });

  Bank.associate = (model) => {
    model.Bank.hasOne(model.SellerDetail, {
      as: 'bank',
      foreignKey: 'bankId',
    });
  };

  return Bank;
};
