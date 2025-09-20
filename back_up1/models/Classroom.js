// const { DataTypes } = require('sequelize');
// const { sequelize } = require('../config/db'); // Correct import path

// const Classroom = sequelize.define('Classroom', {
//   classroom_id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true
//   },
module.exports = (sequelize, DataTypes) => {
  const Classroom = sequelize.define('Classroom', {
    classroom_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  teacher_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  schedule: {
    type: DataTypes.JSONB
  },
  max_students: {
    type: DataTypes.INTEGER
  },
  current_students: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'classrooms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Classroom.associate = (models) => {
  Classroom.belongsTo(models.Course, { foreignKey: 'course_id' });
  Classroom.belongsTo(models.User, { foreignKey: 'teacher_id', as: 'Teacher' });
  Classroom.hasMany(models.ClassroomEnrollment, { foreignKey: 'classroom_id' });
  Classroom.hasMany(models.Exam, { foreignKey: 'classroom_id' });
};

// module.exports = Classroom;
 return Classroom;
};