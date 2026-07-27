const pool = require('./db');
const bcrypt = require('bcrypt');

async function reset() {
  try {
    const hashed = await bcrypt.hash('1234', 10);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashed, 'atindrau111@gmail.com']);
    console.log('Password reset successfully for atindrau111@gmail.com to 1234');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
reset();
