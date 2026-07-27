import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GenerateQR from "./GenerateQR";
import HomeButton from "./HomeButton";
import API from "../api";
import { getSavedUser, getToken, logoutUser } from "../utils/storage";

export default function TeacherDashboard() {
  const [user] = useState(() => getSavedUser());
  const [token] = useState(() => getToken());
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendanceSummary = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await fetch(API(`attendance/summary/${user.id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setAttendanceRecords(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceSummary();
  }, [user, token]);

  if (!user) {
    return <h2 className="text-red-600 p-6">❌ No teacher logged in</h2>;
  }

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  const handleExport = async () => {
    try {
      const res = await fetch(API(`reports/export/${user.id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attendance_export.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("❌ Could not export attendance data");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="header mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-800">👨‍🏫 Teacher Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Welcome, <b>{user.name}</b>
        </p>
        <p className="text-sm text-gray-500">Email: {user.email}</p>

        <div className="flex flex-wrap gap-2 items-center mt-4">
          <HomeButton role={user.role} />
          <button
            onClick={() => navigate("/teacher/sections")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📚 Manage Sections
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📥 Export CSV
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <GenerateQR token={token} onGenerate={fetchAttendanceSummary} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📊 Attendance Records</h2>
            <button
              onClick={fetchAttendanceSummary}
              className="text-sm text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : attendanceRecords.length === 0 ? (
            <p className="text-gray-500">
              No attendance records yet. Generate a QR token for students to scan.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attendanceRecords.map((record) => (
                <div
                  key={record.id}
                  className="border-l-4 border-blue-500 pl-3 py-2"
                >
                  <p className="text-sm font-medium">
                    {record.student_name || "Student"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.student_email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">
                    ✓ {record.status || "Present"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
