import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function FinanceManager() {
  const [revenues, setRevenues] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [revForm, setRevForm] = useState({ amount: '', source: '' });
  const [expForm, setExpForm] = useState({ amount: '', description: '' });
  const [tab, setTab] = useState('revenue');

  const loadRevenue = () => api.get('/revenue/revenue').then(r => setRevenues(r.data)).catch(() => {});
  const loadExpense = () => api.get('/revenue/expense').then(r => setExpenses(r.data)).catch(() => {});

  useEffect(() => { loadRevenue(); loadExpense(); }, []);

  const addRevenue = async (e) => {
    e.preventDefault();
    await api.post('/revenue/revenue', revForm);
    setRevForm({ amount: '', source: '' });
    loadRevenue();
  };

  const addExpense = async (e) => {
    e.preventDefault();
    await api.post('/revenue/expense', expForm);
    setExpForm({ amount: '', description: '' });
    loadExpense();
  };

  const totalRev = revenues.reduce((s, r) => s + r.amount, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Finance Manager</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-sm text-green-600">Revenue</p>
          <p className="text-2xl font-bold text-green-700">${totalRev.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm text-red-600">Expenses</p>
          <p className="text-2xl font-bold text-red-700">${totalExp.toLocaleString()}</p>
        </div>
        <div className={`border rounded-xl p-4 text-center ${totalRev - totalExp >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-sm text-gray-600">Profit/Loss</p>
          <p className={`text-2xl font-bold ${totalRev - totalExp >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            ${(totalRev - totalExp).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('revenue')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'revenue' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}>Revenue</button>
        <button onClick={() => setTab('expense')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'expense' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'}`}>Expenses</button>
      </div>

      {tab === 'revenue' && (
        <div>
          <form onSubmit={addRevenue} className="bg-white rounded-xl p-4 shadow-sm mb-4 flex gap-3">
            <input required placeholder="Amount" type="number" className="border rounded-lg px-3 py-2 flex-1 text-sm" value={revForm.amount} onChange={e => setRevForm({ ...revForm, amount: e.target.value })} />
            <input required placeholder="Source" className="border rounded-lg px-3 py-2 flex-1 text-sm" value={revForm.source} onChange={e => setRevForm({ ...revForm, source: e.target.value })} />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Add</button>
          </form>
          <div className="space-y-2">
            {revenues.map(r => (
              <div key={r._id} className="bg-white rounded-lg p-3 shadow-sm flex justify-between items-center">
                <div><p className="text-sm font-medium">{r.source}</p><p className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-3">
                  <span className="text-green-600 font-semibold">+${r.amount}</span>
                  <button onClick={() => api.delete(`/revenue/revenue/${r._id}`).then(loadRevenue)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'expense' && (
        <div>
          <form onSubmit={addExpense} className="bg-white rounded-xl p-4 shadow-sm mb-4 flex gap-3">
            <input required placeholder="Amount" type="number" className="border rounded-lg px-3 py-2 flex-1 text-sm" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
            <input required placeholder="Description" className="border rounded-lg px-3 py-2 flex-1 text-sm" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} />
            <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">Add</button>
          </form>
          <div className="space-y-2">
            {expenses.map(e => (
              <div key={e._id} className="bg-white rounded-lg p-3 shadow-sm flex justify-between items-center">
                <div><p className="text-sm font-medium">{e.description}</p><p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-3">
                  <span className="text-red-500 font-semibold">-${e.amount}</span>
                  <button onClick={() => api.delete(`/revenue/expense/${e._id}`).then(loadExpense)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
