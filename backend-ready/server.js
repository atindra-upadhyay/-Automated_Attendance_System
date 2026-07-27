const express = require('express');
require('dotenv').config();
const cors = require('cors');
const pool = require('./db');
const { router: authRouter, authMiddleware } = require('./routes/auth');
const qrRouter = require('./routes/qr');
const attendanceRouter = require('./routes/attendance');
const reportsRouter = require('./routes/reports');
const academicsRouter = require('./routes/academics');
const { sendEmail, sendSMS } = require('./utils/mailer');
const cron = require('node-cron');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://automated-attendance-system-ssru.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Trust proxy to get real IP addresses
app.set('trust proxy', true);

app.use('/api/auth', authRouter);
app.use('/api/qr', qrRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/academics', academicsRouter);

app.get('/', (req,res)=> res.send('E-Attend backend running'));

cron.schedule('0 2 * * *', async ()=>{
  try{
    console.log('[CRON] Running daily attendance check');
    const [students] = await pool.query('SELECT id, name, email FROM users WHERE role="student"');
    for(const s of students){
      const [totalRes] = await pool.query('SELECT COUNT(*) as total FROM attendance WHERE student_id = ?', [s.id]);
      const [presentRes] = await pool.query('SELECT COUNT(*) as present FROM attendance WHERE student_id = ? AND status="present"', [s.id]);
      const total = totalRes[0].total;
      const present = presentRes[0].present;
      if(total === 0) continue;
      const pct = (present / total) * 100;
      if(pct < 75){
        const msg = `Alert: Your attendance is ${pct.toFixed(1)}%. Please improve to avoid consequences.`;
        await sendEmail(s.email, 'Attendance Alert', msg);
        await sendSMS(s.email, msg);
        console.log('[CRON] Alert sent to', s.email, pct);
      }
    }
  }catch(err){ console.error('[CRON ERR]', err); }
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, async () => {
  try {
    console.log(`Server started on ${PORT}`);
    console.log(`Backend URL: http://localhost:${PORT}/`);
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash('1234', 10);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashed, 'atindrau111@gmail.com']);
    console.log('[DEBUG] Password for atindrau111@gmail.com has been set/reset to 1234');
  } catch (err) {
    console.error('[DEBUG ERR] Error in startup listener callback:', err.message || err);
  }
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. The backend is likely already running.`);
    console.error(`Check: http://localhost:${PORT}/`);
    console.error(`To restart, stop the existing process first (Windows):`);
    console.error(`  netstat -ano | findstr :${PORT}`);
    console.error(`  taskkill /PID <pid> /F`);
    process.exit(1);
  }
  throw err;
});
