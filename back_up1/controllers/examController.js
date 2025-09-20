const { Exam, Question, ExamAttempt, StudentAnswer, Classroom, User } = require('../models/Exam');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.createExam = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { classroom_id, title, description, duration_minutes, total_marks, questions } = req.body;

    // Verify the requesting user is the teacher of this classroom
    const classroom = await Classroom.findOne({
      where: { 
        classroom_id,
        teacher_id: req.user.userId 
      }
    });

    if (!classroom) {
      return res.status(403).json({ error: 'You are not authorized to create exams for this classroom' });
    }

    const exam = await Exam.create({
      classroom_id,
      title,
      description,
      duration_minutes,
      total_marks,
      created_by: req.user.userId,
      status: 'draft'
    });

    // Create questions
    if (questions && questions.length > 0) {
      await Promise.all(questions.map(async (q) => {
        await Question.create({
          exam_id: exam.exam_id,
          question_text: q.question_text,
          question_type: q.question_type,
          marks: q.marks,
          options: q.options,
          correct_answer: q.correct_answer
        });
      }));
    }

    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
};

exports.getExams = async (req, res, next) => {
  try {
    const { role } = req.user;
    let exams;

    if (role === 'teacher') {
      exams = await Exam.findAll({
        where: { created_by: req.user.userId },
        include: [
          { model: Classroom, attributes: ['title'] },
          { model: Question, attributes: ['question_id'] }
        ]
      });
    } else if (role === 'student') {
      // Get exams for classrooms the student is enrolled in
      exams = await Exam.findAll({
        include: [
          { 
            model: Classroom,
            where: { '$ClassroomEnrollments.student_id$': req.user.userId },
            attributes: ['title'],
            include: [{
              association: 'ClassroomEnrollments',
              where: { student_id: req.user.userId },
              attributes: []
            }]
          },
          { model: Question, attributes: ['question_id'] }
        ]
      });
    } else {
      exams = await Exam.findAll({
        include: [
          { model: Classroom, attributes: ['title'] },
          { model: Question, attributes: ['question_id'] }
        ]
      });
    }

    res.json(exams);
  } catch (error) {
    next(error);
  }
};

exports.startExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check if exam is published
    if (!exam.is_published) {
      return res.status(400).json({ error: 'Exam is not published yet' });
    }

    // Check if exam time is valid
    const now = new Date();
    if (exam.start_time && now < new Date(exam.start_time)) {
      return res.status(400).json({ error: 'Exam has not started yet' });
    }
    if (exam.end_time && now > new Date(exam.end_time)) {
      return res.status(400).json({ error: 'Exam has already ended' });
    }

    // Check if student is enrolled in the classroom
    const enrollment = await ClassroomEnrollment.findOne({
      where: {
        classroom_id: exam.classroom_id,
        student_id: req.user.userId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this classroom' });
    }

    // Check for existing attempt
    const existingAttempt = await ExamAttempt.findOne({
      where: {
        exam_id: id,
        student_id: req.user.userId,
        status: 'in_progress'
      }
    });

    if (existingAttempt) {
      return res.status(400).json({ error: 'You already have an ongoing attempt' });
    }

    // Create new attempt
    const attempt = await ExamAttempt.create({
      exam_id: id,
      student_id: req.user.userId,
      start_time: new Date(),
      status: 'in_progress'
    });

    res.status(201).json(attempt);
  } catch (error) {
    next(error);
  }
};

// ... additional exam controller methods
// Add to examController.js

exports.getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const exam = await Exam.findByPk(id, {
      include: [
        { model: Classroom, attributes: ['title'] },
        { model: Question },
        { model: User, as: 'Creator', attributes: ['first_name', 'last_name'] }
      ]
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check if user is authorized (teacher or enrolled student)
    if (req.user.role === 'student') {
      const enrollment = await ClassroomEnrollment.findOne({
        where: {
          classroom_id: exam.classroom_id,
          student_id: req.user.userId
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Unauthorized to view this exam' });
      }
    } else if (req.user.role === 'teacher' && exam.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to view this exam' });
    }

    res.json(exam);
  } catch (error) {
    next(error);
  }
};

exports.updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Only creator or admin can update
    if (req.user.role !== 'admin' && exam.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this exam' });
    }

    // Can't update if exam is already published
    if (exam.is_published) {
      return res.status(400).json({ error: 'Cannot update a published exam' });
    }

    await exam.update(updates);
    res.json(exam);
  } catch (error) {
    next(error);
  }
};

exports.deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const exam = await Exam.findByPk(id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Only creator or admin can delete
    if (req.user.role !== 'admin' && exam.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this exam' });
    }

    await exam.destroy();
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.publishExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;
    
    const exam = await Exam.findByPk(id, {
      include: [Question]
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Only creator or admin can publish
    if (req.user.role !== 'admin' && exam.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to publish this exam' });
    }

    // Check if exam has questions
    if (exam.Questions.length === 0) {
      return res.status(400).json({ error: 'Cannot publish an exam with no questions' });
    }

    await exam.update({
      is_published: true,
      status: 'scheduled',
      start_time,
      end_time
    });

    res.json(exam);
  } catch (error) {
    next(error);
  }
};

exports.submitExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    
    const exam = await Exam.findByPk(id, {
      include: [Question]
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Check if exam is ongoing
    const now = new Date();
    if (now < new Date(exam.start_time) ){
      return res.status(400).json({ error: 'Exam has not started yet' });
    }
    if (now > new Date(exam.end_time)) {
      return res.status(400).json({ error: 'Exam has already ended' });
    }

    // Check if student is enrolled
    const enrollment = await ClassroomEnrollment.findOne({
      where: {
        classroom_id: exam.classroom_id,
        student_id: req.user.userId
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this classroom' });
    }

    // Check for existing attempt
    let attempt = await ExamAttempt.findOne({
      where: {
        exam_id: id,
        student_id: req.user.userId,
        status: 'in_progress'
      }
    });

    if (!attempt) {
      return res.status(400).json({ error: 'No ongoing attempt found' });
    }

    // Calculate score
    let score = 0;
    const questions = exam.Questions;
    const answerRecords = [];

    for (const question of questions) {
      const studentAnswer = answers.find(a => a.question_id === question.question_id);
      const isCorrect = studentAnswer && studentAnswer.answer === question.correct_answer;
      
      if (isCorrect) {
        score += question.marks;
      }

      answerRecords.push({
        attempt_id: attempt.attempt_id,
        question_id: question.question_id,
        answer: studentAnswer ? studentAnswer.answer : null,
        is_correct: isCorrect,
        marks_awarded: isCorrect ? question.marks : 0
      });
    }

    // Save answers and update attempt
    await StudentAnswer.bulkCreate(answerRecords);
    await attempt.update({
      end_time: new Date(),
      status: 'completed',
      score,
      percentage: (score / exam.total_marks) * 100
    });

    res.json(attempt);
  } catch (error) {
    next(error);
  }
};