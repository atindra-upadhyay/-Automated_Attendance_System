const express = require('express');
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const router = express.Router();

router.post('/register', async (req,res)=>{
  try{
    const {name,email,password,role,phone_number,imei_number} = req.body;
    if(!phone_number) return res.status(400).json({ok:false, error: 'Phone number is required'});
    if(!imei_number) return res.status(400).json({ok:false, error: 'IMEI number is required'});
    
    // Validate IMEI format (15 digits)
    if(!/^\d{15}$/.test(imei_number)) return res.status(400).json({ok:false, error: 'IMEI must be exactly 15 digits'});
    
    const hashed = await bcrypt.hash(password,10);
    const [result] = await pool.query('INSERT INTO users (name,email,password,role,phone_number,imei_number) VALUES (?, ?, ?, ?, ?, ?)', 
                                    [name,email,hashed, role || 'student', phone_number, imei_number]);
    res.json({ok:true, id: result.insertId});
  }catch(err){
    console.error(err);
    if(err.code === 'ER_DUP_ENTRY') {
      if(err.message.includes('email')) return res.status(400).json({ok:false, error: 'Email already exists'});
      if(err.message.includes('phone_number')) return res.status(400).json({ok:false, error: 'Phone number already exists'});
      if(err.message.includes('imei_number')) return res.status(400).json({ok:false, error: 'IMEI number already exists'});
    }
    res.status(400).json({ok:false, error: err.message});
  }
});

router.post('/login', async (req,res)=>{
  try{
    const {email,password} = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('[LOGIN DEBUG] Query result length:', rows.length);
    if (!rows.length) return res.status(401).json({ok:false, message:'Invalid credentials'});
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    console.log('[LOGIN DEBUG] Password match result:', match);
    if(!match) return res.status(401).json({ok:false, message:'Invalid credentials'});
    const token = jwt.sign({id:user.id, role:user.role, name:user.name, email:user.email}, process.env.JWT_SECRET || 'secret', {expiresIn:'8h'});
    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone_number: user.phone_number || null,
        imei_number: user.imei_number || null,
      },
    });
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false, error:err.message});
  }
});

function authMiddleware(req,res,next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({ok:false, message:'No token'});
  const token = header.split(' ')[1];
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  }catch(e){
    return res.status(401).json({ok:false, message:'Invalid token'});
  }
}

module.exports = { router, authMiddleware };

// Utility: find user by email (for teacher enrollment helper)
// POST /api/auth/find { email }
// Returns: {ok:true, user:{id,name,email,role}}
router.post('/find', async (req,res)=>{
  try{
    const { email } = req.body;
    const [rows] = await pool.query('SELECT id,name,email,role FROM users WHERE email=?',[email]);
    if(!rows.length) return res.json({ok:false, message:'Not found'});
    res.json({ok:true, user: rows[0]});
  }catch(err){ res.status(500).json({ok:false, error:err.message}); }
});
