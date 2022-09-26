module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sellerId: {
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
