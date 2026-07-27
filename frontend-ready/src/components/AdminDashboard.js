import React, { useEffect, useState } from 'react';
import API, { apiFetch } from '../api';
import HomeButton from './HomeButton';

export default function AdminDashboard({ token, user, onLogout }) {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);

  const [depForm, setDepForm] = useState({ name: '', code: '' });
  const [semForm, setSemForm] = useState({ name: '', start_date: '', end_date: '', active: true });
  const [courseForm, setCourseForm] = useState({ department_id: '', code: '', title: '', credits: 3 });

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function loadAll(){
    try{
      const [dj,sj,cj] = await Promise.all([
        apiFetch('academics/departments', { headers }),
        apiFetch('academics/semesters', { headers }),
        apiFetch('academics/courses', { headers })
      ]);
      setDepartments(dj.data);
      setSemesters(sj.data);
      setCourses(cj.data);
    }catch(err){
      alert('Failed to load academics: ' + err.message);
    }
  }

  useEffect(()=>{ loadAll(); }, []);

  async function addDepartment(e){
    e.preventDefault();
    try{ await apiFetch('academics/departments', { method:'POST', headers, body: JSON.stringify(depForm) }); setDepForm({name:'',code:''}); loadAll(); }
    catch(err){ alert(err.message); }
  }

  async function addSemester(e){
    e.preventDefault();
    try{ await apiFetch('academics/semesters', { method:'POST', headers, body: JSON.stringify(semForm) }); setSemForm({ name:'', start_date:'', end_date:'', active:true }); loadAll(); }
    catch(err){ alert(err.message); }
  }

  async function addCourse(e){
    e.preventDefault();
    try{ await apiFetch('academics/courses', { method:'POST', headers, body: JSON.stringify(courseForm) }); setCourseForm({ department_id:'', code:'', title:'', credits:3 }); loadAll(); }
    catch(err){ alert(err.message); }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🛠️ Admin - Academics</h1>
        <div className="flex gap-2 items-center">
          <HomeButton role={user.role} />
          <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded">Logout</button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={()=>setTab('departments')} className={`px-3 py-2 rounded ${tab==='departments'?'bg-blue-600 text-white':'bg-gray-100'}`}>Departments</button>
        <button onClick={()=>setTab('semesters')} className={`px-3 py-2 rounded ${tab==='semesters'?'bg-blue-600 text-white':'bg-gray-100'}`}>Semesters</button>
        <button onClick={()=>setTab('courses')} className={`px-3 py-2 rounded ${tab==='courses'?'bg-blue-600 text-white':'bg-gray-100'}`}>Courses</button>
      </div>

      {tab==='departments' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Add Department</h2>
            <form onSubmit={addDepartment} className="space-y-3">
              <input value={depForm.name} onChange={e=>setDepForm({...depForm,name:e.target.value})} placeholder="Name" className="w-full border p-2 rounded" required />
              <input value={depForm.code} onChange={e=>setDepForm({...depForm,code:e.target.value})} placeholder="Code" className="w-full border p-2 rounded" required />
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </form>
          </div>
          <div className="bg-white rounded shadow p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Departments</h2>
            <table className="w-full">
              <thead><tr className="text-left"><th className="p-2">Name</th><th className="p-2">Code</th></tr></thead>
              <tbody>
                {departments.map(d=> (
                  <tr key={d.id} className="border-t"><td className="p-2">{d.name}</td><td className="p-2">{d.code}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='semesters' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Add Semester</h2>
            <form onSubmit={addSemester} className="space-y-3">
              <input value={semForm.name} onChange={e=>setSemForm({...semForm,name:e.target.value})} placeholder="Name" className="w-full border p-2 rounded" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={semForm.start_date} onChange={e=>setSemForm({...semForm,start_date:e.target.value})} className="border p-2 rounded" required />
                <input type="date" value={semForm.end_date} onChange={e=>setSemForm({...semForm,end_date:e.target.value})} className="border p-2 rounded" required />
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={semForm.active} onChange={e=>setSemForm({...semForm,active:e.target.checked})} /> Active</label>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </form>
          </div>
          <div className="bg-white rounded shadow p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Semesters</h2>
            <table className="w-full">
              <thead><tr className="text-left"><th className="p-2">Name</th><th className="p-2">Start</th><th className="p-2">End</th><th className="p-2">Active</th></tr></thead>
              <tbody>
                {semesters.map(s=> (
                  <tr key={s.id} className="border-t"><td className="p-2">{s.name}</td><td className="p-2">{s.start_date?.slice(0,10)}</td><td className="p-2">{s.end_date?.slice(0,10)}</td><td className="p-2">{s.active? 'Yes':'No'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='courses' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">Add Course</h2>
            <form onSubmit={addCourse} className="space-y-3">
              <select value={courseForm.department_id} onChange={e=>setCourseForm({...courseForm,department_id:e.target.value})} className="w-full border p-2 rounded" required>
                <option value="">Select department</option>
                {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input value={courseForm.code} onChange={e=>setCourseForm({...courseForm,code:e.target.value})} placeholder="Code" className="w-full border p-2 rounded" required />
              <input value={courseForm.title} onChange={e=>setCourseForm({...courseForm,title:e.target.value})} placeholder="Title" className="w-full border p-2 rounded" required />
              <input type="number" step="0.5" value={courseForm.credits} onChange={e=>setCourseForm({...courseForm,credits:e.target.value})} placeholder="Credits" className="w-full border p-2 rounded" />
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </form>
          </div>
          <div className="bg-white rounded shadow p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Courses</h2>
            <table className="w-full">
              <thead><tr className="text-left"><th className="p-2">Dept</th><th className="p-2">Code</th><th className="p-2">Title</th><th className="p-2">Credits</th></tr></thead>
              <tbody>
                {courses.map(c=> (
                  <tr key={c.id} className="border-t"><td className="p-2">{c.department_name}</td><td className="p-2">{c.code}</td><td className="p-2">{c.title}</td><td className="p-2">{c.credits}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
