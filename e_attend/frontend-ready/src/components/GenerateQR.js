import React, {useState} from 'react';
import API from '../api';
import { QRCodeCanvas } from 'qrcode.react';

export default function GenerateQR({token, onGenerate}){
  const [qrToken, setQrToken] = useState('');
  const [expires, setExpires] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate(){
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API('qr/generate'), { 
        method:'POST', 
        headers:{'Authorization':`Bearer ${token}`}
      });
      const data = await res.json();
      if(data.ok){
        setQrToken(data.token);
        setExpires(new Date(data.expires_at).toLocaleTimeString());
        if(onGenerate) onGenerate();
      } else {
        setError(data.message || data.error || 'Could not generate QR token');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(qrToken);
    } catch {
      const input = document.createElement('textarea');
      input.value = qrToken;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">🔗 Generate QR Token</h3>
      <p className="text-gray-600">Create a dynamic QR token valid for 5 minutes</p>
      
      <button 
        onClick={generate}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Generating...' : '🎯 Generate QR Token'}
      </button>

      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {qrToken && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="font-medium text-green-800">QR Token Generated</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
            <div className="flex items-center justify-center p-3 bg-white rounded border w-[180px] h-[180px]">
              <QRCodeCanvas value={qrToken} size={160} includeMargin={true} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Token:</label>
              <div className="flex items-center space-x-2">
                <input value={qrToken} readOnly className="flex-1 p-2 bg-gray-50 border rounded text-sm font-mono" />
                <button onClick={copyToken} className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">📋 Copy</button>
              </div>
              <p className="text-sm text-gray-600 mt-2">⏰ Expires at: {expires}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
