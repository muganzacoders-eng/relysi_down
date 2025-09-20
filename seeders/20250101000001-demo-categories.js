'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('content_categories', [
      {
        name: 'Mathematics',
        description: 'Mathematical concepts, algebra, calculus, geometry, and more'
      },
      {
        name: 'Science',
        description: 'Physics, chemistry, biology, and general science topics'
      },
      {
        name: 'Computer Science',
        description: 'Programming, algorithms, data structures, and technology'
      },
      {
        name: 'Languages',
        description: 'English, foreign languages, literature, and communication'
      },
      {
        name: 'History',
        description: 'World history, historical events, and social studies'
      },
      {
        name: 'Arts',
        description: 'Visual arts, music, drama, and creative subjects'
      },
      {
        name: 'Business',
        description: 'Economics, finance, marketing, and business studies'
      },
      {
        name: 'Health & Medicine',
        description: 'Medical sciences, health education, and wellness'
      },
      {
        name: 'Engineering',
        description: 'Various engineering disciplines and technical subjects'
      },
      {
        name: 'General Education',
        description: 'Miscellaneous educational content and study skills'
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('content_categories', null, {});
  }
};