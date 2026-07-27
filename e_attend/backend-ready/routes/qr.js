const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authMiddleware } = require('./auth');
require('dotenv').config();

const router = express.Router();

router.post('/generate', authMiddleware, async (req,res)=>{
  try{
    if(req.user.role !== 'teacher') return res.status(403).json({ok:false, message:'Only teacher allowed'});
    const token = uuidv4();
    const expirySeconds = Number(process.env.QR_TOKEN_EXPIRY_SECONDS) || 300;
    const expires_at = new Date(Date.now() + expirySeconds*1000);
    const [result] = await pool.query('INSERT INTO qr_tokens (token, teacher_id, expires_at) VALUES (?, ?, ?)', [token, req.user.id, expires_at]);
    res.json({ok:true, token, expires_at});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false, error: err.message});
  }
});

router.post('/validate', async (req,res)=>{
  try{
    const {token} = req.body;
    const [rows] = await pool.query('SELECT * FROM qr_tokens WHERE token = ? ORDER BY id DESC LIMIT 1', [token]);
    if(!rows.length) return res.status(400).json({ok:false, message:'Invalid token'});
    const t = rows[0];
    if(new Date(t.expires_at) < new Date()) return res.status(400).json({ok:false, message:'Token expired'});
    res.json({ok:true, token_id: t.id, teacher_id: t.teacher_id});
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false, error: err.message});
  }
});

module.exports = router;
