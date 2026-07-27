const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Simple admin/teacher guard helper
function requireRole(roles){
  return (req,res,next)=>{
    if(!req.user || !roles.includes(req.user.role)){
      return res.status(403).json({ok:false, message:'Forbidden'});
    }
    next();
  };
}

// Departments
router.get('/departments', authMiddleware, async (req,res)=>{
  try{
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY name');
    res.json({ok:true, data: rows});
  }catch(err){ res.status(500).json({ok:false, error:err.message}); }
});
router.post('/departments', authMiddleware, requireRole(['admin']), async (req,res)=>{
  const {name, code} = req.body;
  try{
    const [r] = await pool.query('INSERT INTO departments (name, code) VALUES (?,?)',[name,code]);
    res.json({ok:true, id:r.insertId});
  }catch(err){ res.status(400).json({ok:false, error:err.message}); }
});

// Semesters
router.get('/semesters', authMiddleware, async (req,res)=>{
  try{
    const [rows] = await pool.query('SELECT * FROM semesters ORDER BY start_date DESC');
    res.json({ok:true, data: rows});
  }catch(err){ res.status(500).json({ok:false, error:err.message}); }
});
router.post('/semesters', authMiddleware, requireRole(['admin']), async (req,res)=>{
  const {name,start_date,end_date,active} = req.body;
  try{
    const [r] = await pool.query('INSERT INTO semesters (name,start_date,end_date,active) VALUES (?,?,?,?)',[name,start_date,end_date, active?1:0]);
    res.json({ok:true, id:r.insertId});
  }catch(err){ res.status(400).json({ok:false, error:err.message}); }
});

// Courses
router.get('/courses', authMiddleware, async (req,res)=>{
  try{
    const [rows] = await pool.query('SELECT c.*, d.name as department_name FROM courses c JOIN departments d ON c.department_id=d.id ORDER BY d.name,c.code');
    res.json({ok:true, data: rows});
  }catch(err){ res.status(500).json({ok:false, error:err.message}); }
});
router.post('/courses', authMiddleware, requireRole(['admin']), async (req,res)=>{
  const {department_id, code, title, credits} = req.body;
  try{
    const [r] = await pool.query('INSERT INTO courses (department_id, code, title, credits) VALUES (?,?,?,?)',[department_id, code, title, credits||3.0]);
    res.json({ok:true, id:r.insertId});
  }catch(err){ res.status(400).json({ok:false, error:err.message}); }
});

// Sections
router.get('/sections', authMiddleware, async (req,res)=>{
  try{
    const [rows] = await pool.query(`SELECT s.*, c.code as course_code, c.title as course_title, sem.name as semester_name, u.name as teacher_name
      FROM sections s
      JOIN courses c ON s.course_id=c.id
      JOIN semesters sem ON s.semester_id=sem.id
      LEFT JOIN users u ON s.teacher_id=u.id
      ORDER BY sem.start_date DESC, c.code, s.name`);
    res.json({ok:true, data: rows});
  }catch(err){ res.status(500).json({ok:false, error:err.message}); }
});
router.post('/sections', authMiddleware, requireRole(['admin','teacher']), async (req,res)=>{
  const {course_id, semester_id, teacher_id, name, capacity} = req.body;
  try{
    const [r] = await pool.query('INSERT INTO sections (course_id, semester_id, teacher_id, name, capacity) VALUES (?,?,?,?,?)',[course_id, semester_id, teacher_id||null, name, capacity||60]);
    res.json({ok:true, id:r.insertId});
  }catch(err){ res.status(400).json({ok:false, error:err.message}); }
});

// Enrollments
router.get('/sections/:sectionId/enrollments', authMiddleware, async (req,res)=>{
  try{
    const sectionId = req.params.sectionId;
    const [rows] = await pool.query(`SELECT e.*, u.name, u.email FROM enrollments e JOIN users u ON e.student_id=u.id WHERE e.section_id=? ORDER BY u.name`,[sectionId]);
    res.json({ok:true, data: rows});
  }catch(err){ res.status(500).json({ok:false, error:err.message}); }
});
router.post('/sections/:sectionId/enrollments', authMiddleware, requireRole(['admin','teacher']), async (req,res)=>{
  const sectionId = req.params.sectionId;
  const { student_id } = req.body;
  try{
    const [r] = await pool.query('INSERT INTO enrollments (section_id, student_id) VALUES (?,?)',[sectionId, student_id]);
    res.json({ok:true, id:r.insertId});
  }catch(err){ res.status(400).json({ok:false, error:err.message}); }
});

// Timetable
router.get('/sections/:sectionId/timetable', authMiddleware, async (req,res)=>{
  try{
    const sectionId = req.params.sectionId;
    const [rows] = await pool.query('SELECT * FROM timetable WHERE section_id=? ORDER BY day_of_week, start_time',[sectionId]);
    res.json({ok:true, data: rows});
  }catch(err){ res.status(500).json({ok:false, error:err.message}); }
});
router.post('/sections/:sectionId/timetable', authMiddleware, requireRole(['admin','teacher']), async (req,res)=>{
  const sectionId = req.params.sectionId;
  const { day_of_week, start_time, end_time, room } = req.body;
  try{
    const [r] = await pool.query('INSERT INTO timetable (section_id, day_of_week, start_time, end_time, room) VALUES (?,?,?,?,?)',[sectionId, day_of_week, start_time, end_time, room || null]);
    res.json({ok:true, id:r.insertId});
  }catch(err){
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ok:false, message:'A timetable slot for this day and start time already exists in this section.'});
    }
    res.status(400).json({ok:false, message:err.message || 'Failed to add timetable slot'});
  }
});
router.delete('/timetable/:slotId', authMiddleware, requireRole(['admin','teacher']), async (req,res)=>{
  try{
    const slotId = req.params.slotId;
    await pool.query('DELETE FROM timetable WHERE id=?', [slotId]);
    res.json({ok:true, message:'Timetable slot deleted'});
  }catch(err){ res.status(500).json({ok:false, message:err.message}); }
});

module.exports = router;

// Student views
// GET /api/academics/student/:studentId/sections
router.get('/student/:studentId/sections', authMiddleware, async (req,res)=>{
  try{
    const studentId = req.params.studentId;
    if(req.user.role === 'student' && Number(req.user.id) !== Number(studentId)){
      return res.status(403).json({ok:false, message:'Forbidden'});
    }
    const [rows] = await pool.query(`
      SELECT s.*, c.code as course_code, c.title as course_title, sem.name as semester_name, u.name as teacher_name
      FROM enrollments e
      JOIN sections s ON e.section_id=s.id
      JOIN courses c ON s.course_id=c.id
      JOIN semesters sem ON s.semester_id=sem.id
      LEFT JOIN users u ON s.teacher_id=u.id
      WHERE e.student_id=?
      ORDER BY sem.start_date DESC, c.code
    `,[studentId]);
    res.json({ok:true, data: rows});
  }catch(err){ res.status(500).json({ok:false, error:err.message}); }
});

// GET /api/academics/student/:studentId/timetable
router.get('/student/:studentId/timetable', authMiddleware, async (req,res)=>{
  try{
    const studentId = req.params.studentId;
    if(req.user.role === 'student' && Number(req.user.id) !== Number(studentId)){
      return res.status(403).json({ok:false, message:'Forbidden'});
    }
    const [rows] = await pool.query(`
      SELECT t.*, c.code as course_code, c.title as course_title, s.name as section_name
      FROM enrollments e
      JOIN sections s ON e.section_id=s.id
      JOIN timetable t ON t.section_id=s.id
      JOIN courses c ON s.course_id=c.id
      WHERE e.student_id=?
      ORDER BY t.day_of_week, t.start_time
    `,[studentId]);
    res.json({ok:true, data: rows});
  }catch(err){ res.status(500).json({ok:false, error:err.message}); }
});


