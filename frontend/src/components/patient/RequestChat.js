import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { io } from 'socket.io-client';

export default function RequestChat() {
  const [tokens, setTokens] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [requestType, setRequestType] = useState('CHAT');
  const [msg, setMsg] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const load = () => api.get('/chat-token').then(r => setTokens(r.data)).catch(() => {});

  useEffect(() => {
    load();
    api.get('/doctors').then(r => setDoctors(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRequest = async () => {
    if (!selectedDoctor) return setMsg('Please select a doctor first.');
    try {
      await api.post('/chat-token/request', { doctorId: selectedDoctor, type: requestType });
      setMsg('');
      setSelectedDoctor('');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Request failed.');
    }
  };

  const joinSession = (token) => {
    setActiveSession(token);
    setMessages([]);
    socketRef.current = io('http://localhost:5000');
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
          {activeSession.type === 'VIDEO' ? '📹 Video Call' : '💬 Chat'} — Dr. {activeSession.doctorId?.name}
        </h2>

        {activeSession.type === 'VIDEO' ? (
          <div className="bg-gray-900 rounded-2xl flex flex-col items-center justify-center text-white" style={{ height: 480 }}>
            <div className="text-7xl mb-4">📹</div>
            <p className="text-xl font-semibold">Video Call with Dr. {activeSession.doctorId?.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              Session expires at {new Date(activeSession.endTime).toLocaleTimeString()}
            </p>
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
                <p className="font-semibold text-gray-800">Dr. {activeSession.doctorId?.name}</p>
                <p className="text-xs text-gray-400">
                  ⏱ Expires at {new Date(activeSession.endTime).toLocaleTimeString()}
                </p>
              </div>
              <button onClick={leaveSession} className="text-sm text-red-500 hover:text-red-700 font-medium">✕ Leave</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-10">Session started. Say hello 👋</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'Patient' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm
                    ${m.sender === 'Patient'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
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
              <button onClick={sendMessage} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700">
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Chat / Video Requests</h2>
      <p className="text-gray-500 text-sm mb-6">
        Choose a doctor and request type. Your request goes to the <strong>Main Doctor</strong> for approval before the session opens.
      </p>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
        <p className="font-semibold mb-1">📋 How it works</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-600">
          <li>You select a doctor and request type below</li>
          <li>Request is sent to the <strong>Main Doctor</strong> for approval</li>
          <li>Once approved, a 30-minute session opens for you to join</li>
        </ol>
      </div>

      {/* New request form */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">New Request</h3>

        {/* Type toggle */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setRequestType('CHAT')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition
              ${requestType === 'CHAT'
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            <span className="text-xl">💬</span> Text Chat
          </button>
          <button
            onClick={() => setRequestType('VIDEO')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition
              ${requestType === 'VIDEO'
                ? 'border-purple-600 bg-purple-50 text-purple-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
          >
            <span className="text-xl">📹</span> Video Call
          </button>
        </div>

        {/* Doctor select */}
        <div className="flex gap-3">
          <select
            className="flex-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedDoctor}
            onChange={e => setSelectedDoctor(e.target.value)}
          >
            <option value="">-- Select a Doctor --</option>
            {doctors.map(d => (
              <option key={d._id} value={d.userId?._id}>
                Dr. {d.userId?.name} — {d.specialization}
              </option>
            ))}
          </select>
          <button
            onClick={handleRequest}
            className={`px-5 py-2.5 rounded-lg text-white text-sm font-medium transition
              ${requestType === 'VIDEO' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Send Request
          </button>
        </div>
        {msg && <p className="text-sm text-red-500 mt-2">{msg}</p>}
        <p className="text-xs text-gray-400 mt-2">
          ℹ️ This request will be reviewed and approved by the Main Doctor.
        </p>
      </div>

      {/* Existing requests */}
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Requests</h3>
      <div className="space-y-3">
        {tokens.map(t => (
          <div key={t._id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span>{t.type === 'VIDEO' ? '📹' : '💬'}</span>
                <p className="font-semibold text-gray-800">Dr. {t.doctorId?.name}</p>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t.type || 'CHAT'}</span>
              </div>
              {t.status === 'ACTIVE' && (
                <p className="text-xs text-green-600">⏱ Expires: {new Date(t.endTime).toLocaleTimeString()}</p>
              )}
              {t.status === 'PENDING' && (
                <p className="text-xs text-yellow-600">⏳ Waiting for Main Doctor approval</p>
              )}
              {t.status === 'REJECTED' && (
                <p className="text-xs text-red-500">❌ Request was rejected by Main Doctor</p>
              )}
              {t.status === 'EXPIRED' && (
                <p className="text-xs text-gray-400">Session expired</p>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${statusBadge[t.status]}`}>
                {t.status}
              </span>
            </div>
            {t.status === 'ACTIVE' && (
              <button
                onClick={() => joinSession(t)}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium
                  ${t.type === 'VIDEO' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}`}
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
