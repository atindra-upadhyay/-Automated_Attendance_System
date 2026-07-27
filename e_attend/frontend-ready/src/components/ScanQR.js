import React, {useState} from 'react';
import API from '../api';

export default function ScanQR({token, onAttendanceMarked}){
  const savedUser = JSON.parse(localStorage.getItem('ea_user') || '{}');
  const [qr, setQr] = useState('');
  const [imei, setImei] = useState(savedUser.imei_number || '');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function mark(e){
    e.preventDefault();
    const cleanToken = qr.trim();
    const cleanImei = imei.trim();
    if (!cleanToken) {
      setMsg('❌ Token is required');
      return;
    }
    setLoading(true);
    setMsg('Sending...');
    try{
      const res = await fetch(API('attendance/mark'), {
        method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${token}`},
        body: JSON.stringify({ token: cleanToken, imei_number: cleanImei })
      });
      const data = await res.json();
      if(data.ok) {
        setMsg('✅ Attendance recorded successfully!');
        setQr('');
        if(onAttendanceMarked) onAttendanceMarked();
      } else {
        setMsg('❌ ' + (data.message || data.error || 'Error'));
      }
    }catch(err){ 
      setMsg('❌ Error: ' + err.message); 
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={mark} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            QR Token (paste from Teacher's QR)
          </label>
          <input 
            value={qr} 
            onChange={e=>setQr(e.target.value)} 
            placeholder="Paste token here..." 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IMEI Number
          </label>
          <input 
            value={imei} 
            onChange={e=>setImei(e.target.value)} 
            placeholder="Enter your 15-digit IMEI number" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength="15"
            pattern="[0-9]{15}"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Must match your registered device IMEI</p>
        </div>
        <button 
          type="submit" 
          disabled={loading || !qr.trim() || !imei.trim()}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Marking Attendance..." : "📱 Mark Attendance"}
        </button>
      </form>
      
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${
          msg.includes('✅') ? 'bg-green-100 text-green-800' : 
          msg.includes('❌') ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          {msg}
        </div>
      )}
      
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p><strong>💡 Tip:</strong> Open the Teacher dashboard, generate a QR token, then copy and paste it here.</p>
      </div>
    </div>
  );
}
