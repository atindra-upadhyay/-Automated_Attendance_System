const pool = require('./db');
const bcrypt = require('bcrypt');

const DEMO_PHONE = '9876543210';
const DEMO_IMEI = '123456789012345';

async function seed(){
  try{
    const conn = await pool.getConnection();
    await conn.query("CREATE DATABASE IF NOT EXISTS e_attend_db");
    await conn.query("USE e_attend_db");
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone_number VARCHAR(20) UNIQUE,
      imei_number VARCHAR(15) UNIQUE,
      role ENUM('teacher','student','admin') NOT NULL DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    for (const col of [
      "ADD COLUMN phone_number VARCHAR(20) UNIQUE",
      "ADD COLUMN imei_number VARCHAR(15) UNIQUE",
    ]) {
      try {
        await conn.query(`ALTER TABLE users ${col}`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      }
    }

    const password = '1234';
    const hashed = await bcrypt.hash(password, 10);
    const demoUsers = [
      [1, 'Demo Teacher', 'teacher@demo.com', 'teacher', '9876543211', '111111111111111'],
      [2, 'Demo Student', 'student@demo.com', 'student', DEMO_PHONE, DEMO_IMEI],
    ];
    for (const [id, name, email, role, phone, imei] of demoUsers) {
      await conn.query(
        `INSERT INTO users (id, name, email, password, role, phone_number, imei_number)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password = VALUES(password),
           role = VALUES(role),
           phone_number = VALUES(phone_number),
           imei_number = VALUES(imei_number)`,
        [id, name, email, hashed, role, phone, imei]
      );
    }
    console.log('Seed completed.');
    console.log('Demo accounts: teacher@demo.com / student@demo.com (password: 1234)');
    console.log(`Demo student IMEI: ${DEMO_IMEI}`);
    conn.release();
    process.exit(0);
  }catch(err){
    console.error('Seed error', err);
    process.exit(1);
  }
}
seed();
