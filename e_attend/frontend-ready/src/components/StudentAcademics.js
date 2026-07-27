import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import HomeButton from './HomeButton';
import { getSavedUser, getToken, logoutUser } from '../utils/storage';

export default function StudentAcademics(){
  const navigate = useNavigate();
  const [user] = useState(() => getSavedUser());
  const [token] = useState(() => getToken());
  const [sections, setSections] = useState([]);
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    if (!user || !token) return;
    const headers = { Authorization: `Bearer ${token}` };
    async function load(){
      const [s, t] = await Promise.all([
        fetch(API(`academics/student/${user.id}/sections`), { headers }),
        fetch(API(`academics/student/${user.id}/timetable`), { headers })
      ]);
      const sj = await s.json(); const tj = await t.json();
      if(sj.ok) setSections(sj.data); if(tj.ok) setSlots(tj.data);
    }
    load();
  }, [user, token]);

  const grouped = useMemo(()=>{
    const days = {1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat',7:'Sun'};
    const out = {};
    Object.keys(days).forEach(k=> out[k]=[]);
    for(const s of slots){ out[s.day_of_week]?.push(s); }
    Object.values(out).forEach(arr=> arr.sort((a,b)=> a.start_time.localeCompare(b.start_time)));
    return { days, out };
  }, [slots]);

  if (!user || !token) {
    return <h2 className="text-red-600 p-6">❌ No student logged in</h2>;
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🎓 My Academics</h1>
        <div className="flex gap-2 items-center">
          <HomeButton role={user.role} />
          <button
            onClick={() => { logoutUser(); navigate('/'); }}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">Enrolled Sections</h2>
        {sections.length===0 ? (
          <p className="text-gray-500">You are not enrolled in any sections.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {sections.map(s=> (
              <div key={s.id} className="border rounded p-3">
                <div className="font-semibold">{s.course_code} - {s.course_title} ({s.name})</div>
                <div className="text-sm text-gray-600">{s.semester_name} • {s.teacher_name || 'TBA'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-3">Weekly Timetable</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(grouped.days).map(([key,label])=> (
            <div key={key} className="border rounded p-3">
              <div className="font-semibold mb-2">{label}</div>
              {grouped.out[key].length===0 ? (
                <p className="text-sm text-gray-500">No classes</p>
              ) : (
                <div className="space-y-2">
                  {grouped.out[key].map(slot=> (
                    <div key={slot.id} className="bg-gray-50 rounded p-2 text-sm">
                      <div className="font-medium">{slot.course_code} - {slot.course_title}</div>
                      <div>{slot.start_time.slice(0,5)} - {slot.end_time.slice(0,5)} {slot.room? `• ${slot.room}`: ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
