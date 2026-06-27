import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScanQR from "./ScanQR";
import HomeButton from "./HomeButton";
import API from "../api";
import { getSavedUser, getToken, logoutUser } from "../utils/storage";

export default function StudentDashboard() {
  const [user] = useState(() => getSavedUser());
  const [token] = useState(() => getToken());
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchAttendanceHistory = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const res = await fetch(API(`attendance/student/${user.id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setAttendanceHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, [user, token]);

  if (!user) {
    return <h2 className="text-red-600 p-6">❌ No student logged in</h2>;
  }

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="header mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-800">🎓 Student Dashboard</h1>
        </div>
        <p className="text-gray-600">Welcome, <b>{user.name}</b></p>
        <p className="text-sm text-gray-500">Email: {user.email}</p>
        
        <div className="flex gap-2 items-center">
          <HomeButton role={user.role} />
          <button
          onClick={handleLogout}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          🚪 Logout
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Scanning Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📱 Mark Attendance</h2>
          <ScanQR token={token} onAttendanceMarked={fetchAttendanceHistory} />
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Attendance History</h2>
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : attendanceHistory.length === 0 ? (
            <p className="text-gray-500">No attendance records yet.</p>
          ) : (
            <div className="space-y-2">
              {attendanceHistory.slice(0, 5).map((record) => (
                <div key={record.id} className="border-l-4 border-green-500 pl-3 py-2">
                  <p className="text-sm font-medium">
                    {new Date(record.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-green-600">✓ {record.status || 'Present'}</p>
                </div>
              ))}
              {attendanceHistory.length > 5 && (
                <p className="text-xs text-gray-500">
                  ... and {attendanceHistory.length - 5} more records
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🎒 Academics</h2>
          <button onClick={()=>navigate('/student/academics')} className="px-4 py-2 bg-blue-600 text-white rounded">Open My Academics</button>
        </div>
      </div>
    </div>
  );
}
