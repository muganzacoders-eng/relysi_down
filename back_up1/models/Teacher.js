// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db');

module.exports = (sequelize, DataTypes) => {
const Teacher = sequelize.define('Teacher', {
  teacher_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  qualifications: {
    type: DataTypes.TEXT
  },
  subjects: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  years_experience: {
    type: DataTypes.INTEGER
  },
  bio: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'teacher_profiles',
  timestamps: false
});

Teacher.associate = (models) => {
  Teacher.belongsTo(models.User, { foreignKey: 'teacher_id' });
};

// module.exports = Teacher;
 return Teacher;
};