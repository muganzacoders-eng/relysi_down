// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');

module.exports = (sequelize, DataTypes) => {
const Parent = sequelize.define('Parent', {
  parent_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  children: {
    type: DataTypes.ARRAY(DataTypes.INTEGER) // Array of student user_ids
  },
  notification_preferences: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'parent_profiles',
  timestamps: false
});

Parent.associate = (models) => {
  Parent.belongsTo(models.User, { foreignKey: 'parent_id' });
};

// module.exports = Parent;
 return Parent;
};