import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomeButton({ role }){
  const navigate = useNavigate();
  const target = role === 'teacher' ? '/teacher' : role === 'student' ? '/student' : role === 'admin' ? '/admin' : '/';
  return (
    <button onClick={()=>navigate(target)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm">🏠 Home</button>
  );
}
