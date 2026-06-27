import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import TeacherDashboard from "./components/TeacherDashboard";
import TeacherSections from "./components/TeacherSections";
import StudentDashboard from "./components/StudentDashboard";
import StudentAcademics from "./components/StudentAcademics";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/sections" element={<TeacherSections />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/academics" element={<StudentAcademics />} />
      </Routes>
    </Router>
  );
}

export default App;
