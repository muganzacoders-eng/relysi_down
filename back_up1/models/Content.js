// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');

module.exports = (sequelize, DataTypes) => {
const Content = sequelize.define('Content', {
  content_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  content_type: {
    type: DataTypes.ENUM('pdf', 'ebook', 'video', 'audio', 'other'),
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_key: {
    type: DataTypes.STRING(255)
  },
  file_size: {
    type: DataTypes.INTEGER
  },
  duration: {
    type: DataTypes.INTEGER
  },
  is_paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  is_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'library_content',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Content.associate = (models) => {
  Content.belongsTo(models.User, { foreignKey: 'uploaded_by' });
  Content.belongsToMany(models.ContentCategory, {
    through: 'content_category_mapping',
    foreignKey: 'content_id'
  });
};

// module.exports = Content;
 return Content;
};