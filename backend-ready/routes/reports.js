const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('./auth');
const createCsvWriter = require('csv-writer').createObjectCsvStringifier;

const router = express.Router();

router.get('/export/:teacherId', authMiddleware, async (req,res)=>{
  try{
    const teacherId = req.params.teacherId;
    const [rows] = await pool.query(
      `SELECT a.id, a.student_id, u.name as student_name, u.email as student_email, a.status, a.lat, a.lng, a.created_at
       FROM attendance a JOIN users u ON a.student_id = u.id WHERE a.teacher_id = ?`, [teacherId]);
    const csvStringifier = createCsvWriter({
      header: [
        {id: 'id', title:'id'},
        {id: 'student_id', title:'student_id'},
        {id: 'student_name', title:'student_name'},
        {id: 'student_email', title:'student_email'},
        {id: 'status', title:'status'},
        {id: 'lat', title:'lat'},
        {id: 'lng', title:'lng'},
        {id: 'created_at', title:'created_at'}
      ]
    });
    const records = rows;
    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    res.setHeader('Content-disposition', 'attachment; filename=attendance_export.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
  }catch(err){
    console.error(err);
    res.status(500).json({ok:false, error: err.message});
  }
});

module.exports = router;
