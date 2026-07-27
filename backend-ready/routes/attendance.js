const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('./auth');
// Geolocation removed from attendance flow

const router = express.Router();

router.post('/mark', authMiddleware, async (req,res)=>{
  try{
    if(req.user.role !== 'student') return res.status(403).json({ok:false, message:'Only students can mark'});
    
    // Check if student has phone number and IMEI number registered
    const [userRows] = await pool.query('SELECT phone_number, imei_number FROM users WHERE id = ?', [req.user.id]);
    if(!userRows.length || !userRows[0].phone_number) {
      return res.status(400).json({ok:false, message:'Phone number not registered. Please contact admin to register your phone number.'});
    }
    if(!userRows[0].imei_number) {
      return res.status(400).json({ok:false, message:'IMEI number not registered. Please contact admin to register your IMEI number.'});
    }
    
    const { token, lat, lng, imei_number } = req.body;
    if(!token) return res.status(400).json({ok:false, message:'Missing token'});
    if(!imei_number) return res.status(400).json({ok:false, message:'IMEI number is required'});
    
    // Validate IMEI format
    if(!/^\d{15}$/.test(imei_number)) return res.status(400).json({ok:false, message:'Invalid IMEI format. Must be 15 digits.'});
    
    // Verify IMEI matches registered IMEI
    if(imei_number !== userRows[0].imei_number) {
      return res.status(400).json({ok:false, message:'IMEI number does not match registered device.'});
    }
    
    const [rows] = await pool.query('SELECT * FROM qr_tokens WHERE token = ? ORDER BY id DESC LIMIT 1', [token]);
    if(!rows.length) return res.status(400).json({ok:false, message:'Invalid token'});
    const t = rows[0];
    if(new Date(t.expires_at) < new Date()) return res.status(400).json({ok:false, message:'Token expired'});

    // Get client IP address
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

    // Store lat/lng as NULL when not provided, include IP address
    await pool.query('INSERT INTO attendance (student_id, teacher_id, token_id, lat, lng, ip_address, status) VALUES (?, ?, ?, ?, ?, ?, ?)', 
                    [req.user.id, t.teacher_id, t.id, lat ?? null, lng ?? null, clientIP, 'present']);
    res.json({ok:true, message:'Attendance recorded'});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false, error: err.message});
  }
});

router.get('/summary/:teacherId', authMiddleware, async (req,res)=>{
  try{
    const teacherId = req.params.teacherId;
    if(req.user.role === 'teacher' && Number(req.user.id) !== Number(teacherId) && req.user.role !== 'admin') {
      return res.status(403).json({ok:false, message:'Unauthorized'});
    }
    const [rows] = await pool.query(
      `SELECT a.*, u.name as student_name, u.email as student_email FROM attendance a
       JOIN users u ON a.student_id = u.id WHERE a.teacher_id = ? ORDER BY a.created_at DESC`, [teacherId]);
    res.json({ok:true, data: rows});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false, error: err.message});
  }
});

router.get('/student/:studentId', authMiddleware, async (req,res)=>{
  try{
    const studentId = req.params.studentId;
    if(req.user.role === 'student' && Number(req.user.id) !== Number(studentId)) {
      return res.status(403).json({ok:false, message:'Unauthorized'});
    }
    const [rows] = await pool.query(
      `SELECT a.*, u.name as teacher_name, u.email as teacher_email FROM attendance a
       JOIN users u ON a.teacher_id = u.id WHERE a.student_id = ? ORDER BY a.created_at DESC`, [studentId]);
    res.json({ok:true, data: rows});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false, error: err.message});
  }
});

module.exports = router;
