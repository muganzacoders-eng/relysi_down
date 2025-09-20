// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');

module.exports = (sequelize, DataTypes) => {
const ContentCategory = sequelize.define('ContentCategory', {
  category_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'content_categories',
  timestamps: false
});

ContentCategory.associate = (models) => {
  ContentCategory.belongsToMany(models.Content, {
    through: 'content_category_mapping',
    foreignKey: 'category_id'
  });
};

// module.exports = ContentCategory;
 return ContentCategory;
};