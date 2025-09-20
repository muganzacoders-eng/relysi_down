const { CounselingSession, User, SessionReport } = require('../models/Counseling');

exports.requestSession = async (req, res, next) => {
  try {
    const { expert_id, scheduled_time, duration_minutes, notes } = req.body;
    
    const session = await CounselingSession.create({
      expert_id,
      student_id: req.user.userId,
      scheduled_time,
      duration_minutes: duration_minutes || 60,
      notes,
      status: 'requested'
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

exports.getSessions = async (req, res, next) => {
  try {
    const { role } = req.user;
    let sessions;

    if (role === 'student') {
      sessions = await CounselingSession.findAll({
        where: { student_id: req.user.userId },
        include: [
          { model: User, as: 'Expert', attributes: ['first_name', 'last_name'] }
        ]
      });
    } else if (role === 'expert') {
      sessions = await CounselingSession.findAll({
        where: { expert_id: req.user.userId },
        include: [
          { model: User, as: 'Student', attributes: ['first_name', 'last_name'] }
        ]
      });
    } else {
      sessions = await CounselingSession.findAll({
        include: [
          { model: User, as: 'Expert', attributes: ['first_name', 'last_name'] },
          { model: User, as: 'Student', attributes: ['first_name', 'last_name'] }
        ]
      });
    }

    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// Add to counselingController.js

exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const session = await CounselingSession.findByPk(id, {
      include: [
        { model: User, as: 'Expert', attributes: ['first_name', 'last_name', 'profile_picture_url'] },
        { model: User, as: 'Student', attributes: ['first_name', 'last_name', 'profile_picture_url'] },
        { model: SessionReport }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is authorized (participant or admin)
    if (req.user.role !== 'admin' && 
        session.expert_id !== req.user.userId && 
        session.student_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to view this session' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const session = await CounselingSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only expert, student or admin can update
    if (req.user.role !== 'admin' && 
        session.expert_id !== req.user.userId && 
        session.student_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this session' });
    }

    // Students can only update notes
    if (req.user.role === 'student' && 
        (Object.keys(updates).length > 1 || !updates.notes)) {
      return res.status(403).json({ error: 'Students can only update session notes' });
    }

    await session.update(updates);
    res.json(session);
  } catch (error) {
    next(error);
  }
};

exports.confirmSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { meeting_link } = req.body;
    
    const session = await CounselingSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only expert or admin can confirm
    if (req.user.role !== 'admin' && session.expert_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to confirm this session' });
    }

    if (session.status !== 'requested') {
      return res.status(400).json({ error: 'Session is not in requested state' });
    }

    await session.update({
      status: 'confirmed',
      meeting_link
    });

    res.json(session);
  } catch (error) {
    next(error);
  }
};

exports.completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { report } = req.body;
    
    const session = await CounselingSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only expert or admin can complete
    if (req.user.role !== 'admin' && session.expert_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to complete this session' });
    }

    if (session.status !== 'confirmed') {
      return res.status(400).json({ error: 'Session is not in confirmed state' });
    }

    // Create session report if provided
    if (report) {
      await SessionReport.create({
        session_id: id,
        expert_id: req.user.userId,
        report_text: report,
        submitted_at: new Date()
      });
    }

    await session.update({
      status: 'completed'
    });

    res.json(session);
  } catch (error) {
    next(error);
  }
};