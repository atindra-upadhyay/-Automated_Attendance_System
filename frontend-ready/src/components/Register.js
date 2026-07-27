import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone_number, setPhone_number] = useState('');
  const [imei_number, setImei_number] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try{
      const res = await fetch(API('auth/register'),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, email, password, role, phone_number, imei_number })
      });
      const data = await res.json();
      if(!data.ok){
        throw new Error(data.message || data.error || 'Registration failed');
      }
      alert('✅ Account created. Please login.');
      navigate('/');
    }catch(err){
      alert('❌ ' + err.message);
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg p-8 rounded-lg w-[28rem]">
        <h2 className="text-2xl font-bold mb-6 text-center">📝 Register</h2>
        <form onSubmit={submit}>
          <input className="w-full p-2 border rounded mb-4" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
          <input className="w-full p-2 border rounded mb-4" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="w-full p-2 border rounded mb-4" placeholder="Phone number" value={phone_number} onChange={e=>setPhone_number(e.target.value)} required />
          <input className="w-full p-2 border rounded mb-4" placeholder="IMEI number (15 digits)" value={imei_number} onChange={e=>setImei_number(e.target.value)} maxLength="15" pattern="[0-9]{15}" required />
          <input className="w-full p-2 border rounded mb-4" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <select className="w-full p-2 border rounded mb-6" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <button disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">{loading? 'Creating...' : 'Create account'}</button>
        </form>
        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link to="/" className="text-blue-600 hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}
