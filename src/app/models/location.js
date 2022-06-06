module.exports = (sequelize, DataTypes) => {
  const schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    provinceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    provinceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cityName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    districtId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    districtName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subDistrictId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subDistrictName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postalCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  };

  return sequelize.define('Location', schema, {
    timestamps: false,
    paranoid: false,
    underscored: true,
    freezeTableName: true,
    engine: 'InnoDB',
    charset: 'utf8',
    tableName: 'locations',
    indexes: [
      {
        unique: true,
        fields: ['province_id', 'province_id_location_idx'],
      },
      {
        unique: false,
        fields: ['province_name', 'province_name_location_idx'],
      },
      {
        unique: true,
        fields: ['city_id', 'city_id_location_idx'],
      },
      {
        unique: false,
        fields: ['city_name', 'city_name_location_idx'],
      },
      {
        unique: true,
        fields: ['district_id', 'district_id_location_idx'],
      },
      {
        unique: false,
        fields: ['district_name', 'district_name_location_idx'],
      },
      {
        unique: true,
        fields: ['sub_district_id', 'sub_district_id_location_idx'],
      },
      {
        unique: false,
        fields: ['sub_district_name', 'sub_district_name_location_idx'],
      },
      {
        unique: false,
        fields: ['postal_code', 'postal_code_location_idx'],
      },
    ],
  });
};
