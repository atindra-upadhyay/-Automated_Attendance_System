CREATE DATABASE IF NOT EXISTS e_attend_db;
USE e_attend_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  imei_number VARCHAR(15) UNIQUE,
  role ENUM('teacher','student','admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qr_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) NOT NULL UNIQUE,
  teacher_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  teacher_id INT NOT NULL,
  token_id INT,
  status ENUM('present','absent') DEFAULT 'present',
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (token_id) REFERENCES qr_tokens(id) ON DELETE SET NULL
);

-- Academic core
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS semesters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  credits DECIMAL(3,1) DEFAULT 3.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(department_id, code),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  semester_id INT NOT NULL,
  teacher_id INT,
  name VARCHAR(50) NOT NULL,
  capacity INT DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(course_id, semester_id, name)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  student_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(section_id, student_id),
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  day_of_week TINYINT NOT NULL, -- 1=Mon ... 7=Sun
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE(section_id, day_of_week, start_time)
);

-- Seed minimal academics so the UI works immediately (idempotent)
INSERT IGNORE INTO departments (id, name, code) VALUES
  (1, 'Computer Science', 'CSE');

INSERT IGNORE INTO semesters (id, name, start_date, end_date, active) VALUES
  (1, 'Sem 1', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 1);

-- Ensure a sample course exists in the seeded department
INSERT IGNORE INTO courses (id, department_id, code, title, credits) VALUES
  (1, 1, 'CSE101', 'Introduction to Computing', 3.0);

-- Create a sample section for the seeded course and semester, taught by demo teacher (user id 1)
INSERT IGNORE INTO sections (id, course_id, semester_id, teacher_id, name, capacity) VALUES
  (1, 1, 1, 1, 'A', 60);

-- Enroll demo student (user id 2) to the sample section, if both users exist
INSERT IGNORE INTO enrollments (section_id, student_id)
SELECT 1 AS section_id, 2 AS student_id
WHERE EXISTS (SELECT 1 FROM users WHERE id=2) AND EXISTS (SELECT 1 FROM sections WHERE id=1);
