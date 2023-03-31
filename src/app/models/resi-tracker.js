module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      allowNull: false,
    },
    logisticsProvider: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastResi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  };

  const ResiTracker = sequelize.define('ResiTracker', schema, {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'resi_tracker',
  });

  ResiTracker.associate = (model) => {


  };


  return ResiTracker;
};
