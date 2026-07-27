import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import HomeButton from './HomeButton';
import { getSavedUser, getToken, logoutUser } from '../utils/storage';

export default function TeacherSections(){
  const navigate = useNavigate();
  const [user] = useState(() => getSavedUser());
  const [token] = useState(() => getToken());
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sectionForm, setSectionForm] = useState({ course_id:'', semester_id:'', name:'A', capacity:60 });

  async function load(){
    if (!user || !token) return;
    const headers = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` };
    const [sec, course, sem] = await Promise.all([
      fetch(API('academics/sections'), { headers }),
      fetch(API('academics/courses'), { headers }),
      fetch(API('academics/semesters'), { headers })
    ]);
    const sj = await sec.json(); const cj = await course.json(); const smj = await sem.json();
    if(sj.ok) setSections(sj.data.filter(s=> !s.teacher_id || s.teacher_id===user.id));
    if(cj.ok) setCourses(cj.data);
    if(smj.ok) setSemesters(smj.data);
  }

  useEffect(() => {
    load();
  }, [user, token]);

  if (!user || !token) {
    return <h2 className="text-red-600 p-6">❌ No teacher logged in</h2>;
  }

  const headers = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` };

  async function createSection(e){
    e.preventDefault();
    const payload = { ...sectionForm, teacher_id: user.id };
    const res = await fetch(API('academics/sections'), { method:'POST', headers, body: JSON.stringify(payload)});
    const data = await res.json();
    if(data.ok){ setSectionForm({ course_id:'', semester_id:'', name:'A', capacity:60 }); load(); }
    else alert(data.message || data.error);
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📚 Teacher - Sections & Timetable</h1>
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
        <h2 className="font-semibold mb-3">Create Section</h2>
        <form onSubmit={createSection} className="grid md:grid-cols-5 gap-3">
          <select value={sectionForm.course_id} onChange={e=>setSectionForm({...sectionForm,course_id:e.target.value})} className="border p-2 rounded" required>
            <option value="">Select Course</option>
            {courses.map(c=> <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
          </select>
          <select value={sectionForm.semester_id} onChange={e=>setSectionForm({...sectionForm,semester_id:e.target.value})} className="border p-2 rounded" required>
            <option value="">Select Semester</option>
            {semesters.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={sectionForm.name} onChange={e=>setSectionForm({...sectionForm,name:e.target.value})} placeholder="Section Name (e.g. A)" className="border p-2 rounded" required />
          <input type="number" value={sectionForm.capacity} onChange={e=>setSectionForm({...sectionForm,capacity:e.target.value})} placeholder="Capacity" className="border p-2 rounded" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Create Section</button>
        </form>
      </div>

      <div className="space-y-6">
        {sections.length === 0 ? (
          <p className="text-gray-500">No sections yet. Create one above.</p>
        ) : sections.map(s => (
          <SectionItem key={s.id} section={s} token={token} />
        ))}
      </div>
    </div>
  );
}

function SectionItem({ section, token }) {
  const [slots, setSlots] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const headers = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` };

  const daysMap = { 1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6:'Sat', 7:'Sun' };

  async function loadDetails() {
    setLoading(true);
    try {
      const [tRes, eRes] = await Promise.all([
        fetch(API(`academics/sections/${section.id}/timetable`), { headers }),
        fetch(API(`academics/sections/${section.id}/enrollments`), { headers })
      ]);
      const tj = await tRes.json();
      const ej = await eRes.json();
      if (tj.ok) setSlots(tj.data || []);
      if (ej.ok) setEnrollments(ej.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [section.id, token]);

  async function enroll(studentEmail) {
    setMsg('');
    try {
      const ures = await fetch(API('auth/find'), { method:'POST', headers, body: JSON.stringify({ email: studentEmail }) });
      const uj = await ures.json();
      if (!uj.ok || !uj.user) throw new Error('Student with this email not found');
      
      const res = await fetch(API(`academics/sections/${section.id}/enrollments`), { 
        method:'POST', headers, body: JSON.stringify({ student_id: uj.user.id })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || data.error || 'Failed to enroll student');
      
      setMsg('✅ Student enrolled successfully!');
      loadDetails();
    } catch (err) {
      setMsg('❌ ' + err.message);
    }
  }

  async function addSlot(day, start, end, room) {
    setMsg('');
    try {
      const res = await fetch(API(`academics/sections/${section.id}/timetable`), { 
        method:'POST', headers, body: JSON.stringify({ day_of_week: day, start_time: start, end_time: end, room })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || data.error || 'Failed to add timetable slot');
      
      setMsg('✅ Timetable slot added successfully!');
      loadDetails();
    } catch (err) {
      setMsg('❌ ' + err.message);
    }
  }

  async function deleteSlot(slotId) {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      const res = await fetch(API(`academics/timetable/${slotId}`), { method:'DELETE', headers });
      const data = await res.json();
      if (data.ok) {
        setMsg('✅ Slot deleted.');
        loadDetails();
      } else {
        setMsg('❌ ' + (data.message || 'Error deleting slot'));
      }
    } catch (err) {
      setMsg('❌ ' + err.message);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
      <div className="flex justify-between items-start border-b pb-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {section.course_code} - {section.course_title} <span className="text-blue-600">(Section {section.name})</span>
          </h2>
          <p className="text-sm text-gray-600">
            {section.semester_name} • Capacity: {section.capacity}
          </p>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          msg.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {msg}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Enrollments & Form */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">🧑‍🎓 Enrolled Students ({enrollments.length})</h3>
            {enrollments.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No students enrolled yet.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {enrollments.map(e => (
                  <div key={e.id} className="text-xs bg-gray-50 p-2 rounded border flex justify-between">
                    <span className="font-medium text-gray-800">{e.name}</span>
                    <span className="text-gray-500">{e.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Enroll Student</h4>
            <EnrollForm onSubmit={enroll} />
          </div>
        </div>

        {/* Right Column: Timetable & Form */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">📅 Existing Timetable Slots ({slots.length})</h3>
            {slots.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No timetable slots added yet.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {slots.map(slot => (
                  <div key={slot.id} className="text-xs bg-blue-50 border border-blue-100 p-2 rounded flex justify-between items-center">
                    <div>
                      <span className="font-bold text-blue-800">{daysMap[slot.day_of_week]}</span>:{' '}
                      <span>{slot.start_time.slice(0,5)} - {slot.end_time.slice(0,5)}</span>
                      {slot.room && <span className="ml-2 text-gray-600">({slot.room})</span>}
                    </div>
                    <button 
                      onClick={() => deleteSlot(slot.id)} 
                      className="text-red-500 hover:text-red-700 font-bold px-1 text-sm"
                      title="Delete slot"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Add Timetable Slot</h4>
            <SlotForm onSubmit={addSlot} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EnrollForm({ onSubmit }){
  const [email, setEmail] = useState('');
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); if (email.trim()) onSubmit(email.trim()); setEmail(''); }} className="flex gap-2">
      <input 
        type="email" 
        value={email} 
        onChange={e=>setEmail(e.target.value)} 
        placeholder="Student email (e.g. student@gmail.com)" 
        className="border p-2 text-sm rounded flex-1 focus:ring-2 focus:ring-blue-500" 
        required 
      />
      <button type="submit" className="bg-green-600 text-white px-4 py-2 text-sm rounded hover:bg-green-700 font-medium">
        Enroll
      </button>
    </form>
  );
}

function SlotForm({ onSubmit }){
  const [day, setDay] = useState(1); 
  const [start, setStart] = useState('09:00'); 
  const [end, setEnd] = useState('10:00'); 
  const [room, setRoom] = useState('');

  return (
    <form onSubmit={(e)=>{ e.preventDefault(); onSubmit(Number(day), start, end, room.trim()); }} className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-gray-600 mb-1">Day</label>
          <select value={day} onChange={e=>setDay(e.target.value)} className="w-full border p-1.5 rounded">
            <option value={1}>Mon</option>
            <option value={2}>Tue</option>
            <option value={3}>Wed</option>
            <option value={4}>Thu</option>
            <option value={5}>Fri</option>
            <option value={6}>Sat</option>
            <option value={7}>Sun</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Room</label>
          <input value={room} onChange={e=>setRoom(e.target.value)} placeholder="e.g. Lab 1" className="w-full border p-1.5 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs items-end">
        <div>
          <label className="block text-gray-600 mb-1">Start Time</label>
          <input type="time" value={start} onChange={e=>setStart(e.target.value)} className="w-full border p-1.5 rounded" required />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">End Time</label>
          <input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="w-full border p-1.5 rounded" required />
        </div>
        <button type="submit" className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 font-medium text-xs">
          + Add Slot
        </button>
      </div>
    </form>
  );
}
