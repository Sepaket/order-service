module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    notification_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    seller_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  };

  const NotificationRead = sequelize.define('NotificationRead', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'notification_reads',
  });

  NotificationRead.associate = (model) => {
    model.NotificationRead.belongsTo(model.Notification, {
      as: 'notification',
    });
  };

  return NotificationRead;
};
