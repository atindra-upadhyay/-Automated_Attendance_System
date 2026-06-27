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

  async function enroll(sectionId, studentEmail){
    try{
      const ures = await fetch(API('auth/find'), { method:'POST', headers, body: JSON.stringify({ email: studentEmail }) });
      const uj = await ures.json();
      if(!uj.ok || !uj.user) throw new Error('User not found');
      const res = await fetch(API(`academics/sections/${sectionId}/enrollments`), { method:'POST', headers, body: JSON.stringify({ student_id: uj.user.id })});
      const data = await res.json();
      if(!data.ok) throw new Error(data.message || data.error);
      alert('Enrolled');
    }catch(err){ alert('❌ '+err.message); }
  }

  async function addSlot(sectionId, day, start, end, room){
    const res = await fetch(API(`academics/sections/${sectionId}/timetable`), { method:'POST', headers, body: JSON.stringify({ day_of_week:day, start_time:start, end_time:end, room })});
    const data = await res.json();
    if(!data.ok) alert(data.message || data.error); else alert('Added');
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📚 Teacher - Sections</h1>
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
            <option value="">Course</option>
            {courses.map(c=> <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
          </select>
          <select value={sectionForm.semester_id} onChange={e=>setSectionForm({...sectionForm,semester_id:e.target.value})} className="border p-2 rounded" required>
            <option value="">Semester</option>
            {semesters.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={sectionForm.name} onChange={e=>setSectionForm({...sectionForm,name:e.target.value})} placeholder="Name" className="border p-2 rounded" />
          <input type="number" value={sectionForm.capacity} onChange={e=>setSectionForm({...sectionForm,capacity:e.target.value})} placeholder="Capacity" className="border p-2 rounded" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
        </form>
      </div>

      <div className="space-y-4">
        {sections.length === 0 ? (
          <p className="text-gray-500">No sections yet. Create one above.</p>
        ) : sections.map(s=> (
          <div key={s.id} className="bg-white rounded shadow p-4">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{s.course_code} - {s.course_title} ({s.name})</div>
                <div className="text-sm text-gray-600">{s.semester_name} • Capacity {s.capacity}</div>
              </div>
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Enroll Student</h3>
                <EnrollForm onSubmit={(email)=>enroll(s.id, email)} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Add Timetable Slot</h3>
                <SlotForm onSubmit={(day,start,end,room)=>addSlot(s.id,day,start,end,room)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnrollForm({ onSubmit }){
  const [email,setEmail] = useState('');
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSubmit(email); setEmail('');}} className="flex gap-2">
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="student email" className="border p-2 rounded flex-1" />
      <button className="bg-green-600 text-white px-4 py-2 rounded">Enroll</button>
    </form>
  );
}

function SlotForm({ onSubmit }){
  const [day,setDay] = useState(1); const [start,setStart] = useState('09:00'); const [end,setEnd] = useState('10:00'); const [room,setRoom]=useState('');
  return (
    <form onSubmit={(e)=>{e.preventDefault(); onSubmit(Number(day),start,end,room);}} className="grid grid-cols-5 gap-2">
      <select value={day} onChange={e=>setDay(e.target.value)} className="border p-2 rounded">
        <option value={1}>Mon</option><option value={2}>Tue</option><option value={3}>Wed</option><option value={4}>Thu</option><option value={5}>Fri</option><option value={6}>Sat</option><option value={7}>Sun</option>
      </select>
      <input type="time" value={start} onChange={e=>setStart(e.target.value)} className="border p-2 rounded" />
      <input type="time" value={end} onChange={e=>setEnd(e.target.value)} className="border p-2 rounded" />
      <input value={room} onChange={e=>setRoom(e.target.value)} placeholder="Room" className="border p-2 rounded" />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
    </form>
  );
}
