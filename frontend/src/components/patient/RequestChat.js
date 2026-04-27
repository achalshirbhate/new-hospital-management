import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function RequestChat() {
  const [tokens, setTokens] = useState([]);
  const [requestType, setRequestType] = useState('CHAT');
  const [msg, setMsg] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const load = () => api.get('/chat-token').then(r => setTokens(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleRequest = async () => {
    try {
      await api.post('/chat-token/request', { type: requestType });
      setMsg('Request sent! Waiting for Admin to assign a doctor and approve.');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Request failed.');
    }
  };

  const joinSession = (token) => {
    setActiveSession(token);
    setMessages([]);
    socketRef.current = io(BACKEND_URL);
    socketRef.current.emit('join-room', token.token);
    socketRef.current.on('receive-message', (data) => {
      setMessages(prev => [...prev, data]);
    });
  };

  const leaveSession = () => {
    socketRef.current?.disconnect();
    setActiveSession(null);
    setMessages([]);
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const data = { roomId: activeSession.token, text: chatInput, sender: 'Patient' };
    socketRef.current.emit('send-message', data);
    setMessages(prev => [...prev, data]);
    setChatInput('');
  };

  const statusBadge = {
    PENDING:  'bg-yellow-100 text-yellow-700',
    ACTIVE:   'bg-green-100 text-green-700',
    EXPIRED:  'bg-gray-100 text-gray-500',
    REJECTED: 'bg-red-100 text-red-700',
  };

  if (activeSession) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {activeSession.type === 'VIDEO' ? '📹 Video Call' : '💬 Chat'}
          {activeSession.doctorId?.name ? ` — Dr. ${activeSession.doctorId.name}` : ''}
        </h2>
        {activeSession.type === 'VIDEO' ? (
          <div className="bg-gray-900 rounded-2xl flex flex-col items-center justify-center text-white" style={{ height: 480 }}>
            <div className="text-7xl mb-4">📹</div>
            <p className="text-xl font-semibold">Video Call{activeSession.doctorId?.name ? ` with Dr. ${activeSession.doctorId.name}` : ''}</p>
            <p className="text-sm text-gray-400 mt-1">Session expires at {new Date(activeSession.endTime).toLocaleTimeString()}</p>
            <div className="flex gap-4 mt-8">
              <button className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full text-sm">🎤 Mute</button>
              <button className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full text-sm">📷 Camera</button>
              <button onClick={leaveSession} className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full text-sm">📵 End Call</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm flex flex-col" style={{ height: 520 }}>
            <div className="px-5 py-3 border-b bg-gray-50 rounded-t-2xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{activeSession.doctorId?.name ? `Dr. ${activeSession.doctorId.name}` : 'Doctor'}</p>
                <p className="text-xs text-gray-400">⏱ Expires at {new Date(activeSession.endTime).toLocaleTimeString()}</p>
              </div>
              <button onClick={leaveSession} className="text-sm text-red-500 hover:text-red-700 font-medium">✕ Leave</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Session started. Say hello 👋</p>}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'Patient' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${m.sender === 'Patient' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t flex gap-2">
              <input
                className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700">Send</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Chat / Video Requests</h2>
      <p className="text-gray-500 text-sm mb-6">Submit a request. Admin will assign a doctor and approve your session.</p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
        <p className="font-semibold mb-1">📋 How it works</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-600">
          <li>You submit a chat or video request</li>
          <li>Admin reviews and assigns a doctor</li>
          <li>Once approved, a 30-minute session opens for you to join</li>
        </ol>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">New Request</h3>
        <div className="flex gap-3 mb-4">
          {['CHAT', 'VIDEO'].map(type => (
            <button
              key={type}
              onClick={() => setRequestType(type)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition
                ${requestType === type
                  ? type === 'VIDEO' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              <span className="text-xl">{type === 'VIDEO' ? '📹' : '💬'}</span>
              {type === 'VIDEO' ? 'Video Call' : 'Text Chat'}
            </button>
          ))}
        </div>
        <button
          onClick={handleRequest}
          className={`w-full py-3 rounded-lg text-white font-medium transition ${requestType === 'VIDEO' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {requestType === 'VIDEO' ? '📹 Request Video Consultation' : '💬 Request Chat'}
        </button>
        {msg && <p className="text-sm text-green-600 mt-2">{msg}</p>}
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Requests</h3>
      <div className="space-y-3">
        {tokens.map(t => (
          <div key={t._id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span>{t.type === 'VIDEO' ? '📹' : '💬'}</span>
                <p className="font-semibold text-gray-800">{t.doctorId?.name ? `Dr. ${t.doctorId.name}` : 'Awaiting doctor assignment'}</p>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t.type}</span>
              </div>
              {t.status === 'PENDING' && <p className="text-xs text-yellow-600">⏳ Waiting for Admin approval</p>}
              {t.status === 'ACTIVE' && <p className="text-xs text-green-600">⏱ Expires: {new Date(t.endTime).toLocaleTimeString()}</p>}
              {t.status === 'REJECTED' && <p className="text-xs text-red-500">❌ Rejected by Admin</p>}
              {t.status === 'EXPIRED' && <p className="text-xs text-gray-400">Session expired</p>}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${statusBadge[t.status]}`}>{t.status}</span>
            </div>
            {t.status === 'ACTIVE' && (
              <button
                onClick={() => joinSession(t)}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${t.type === 'VIDEO' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {t.type === 'VIDEO' ? '📹 Join' : '💬 Join'}
              </button>
            )}
          </div>
        ))}
        {tokens.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">
            <div className="text-3xl mb-2">💬</div>
            <p>No requests yet. Send your first request above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
