'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RosterPage() {
  const [input, setInput] = useState('');
  const [employees, setEmployees] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('boh_roster_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const persist = (emps: string[]) => {
    setEmployees(emps);
    localStorage.setItem('boh_roster_v1', JSON.stringify(emps));
  };

  const addOne = () => {
    const name = input.trim();
    if (name && !employees.includes(name)) {
      persist([...employees, name]);
      setInput('');
    }
  };

  const addBulk = () => {
    const names = input
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter((n) => n && !employees.includes(n));
    if (names.length) {
      persist([...employees, ...names]);
      setInput('');
    }
  };

  const move = (index: number, delta: number) => {
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= employees.length) return;
    const arr = [...employees];
    const [removed] = arr.splice(index, 1);
    arr.splice(newIndex, 0, removed);
    persist(arr);
  };

  const remove = (name: string) => {
    persist(employees.filter((n) => n !== name));
  };

  const clearAll = () => {
    persist([]);
  };

  const exportJSON = () => {
    const data = JSON.stringify({ employees });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roster.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed?.employees)) persist(parsed.employees);
      } catch {
        alert('Invalid JSON');
      }
    };
    reader.readAsText(file);
  };

  const router = useRouter();
  const gamePlanRedirect = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-700">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
        <h1 className="text-xl font-bold mb-4">Roster Manager</h1>

        <div className="flex gap-2 mb-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a name"
            className="flex-1 border rounded p-2"
          />
          <button
            onClick={addOne}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            Add
          </button>
          <button
            onClick={addBulk}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
          >
            Add Bulk
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={exportJSON}
            className="px-3 py-2 bg-slate-600 text-white rounded"
          >
            Export
          </button>
          <label className="px-3 py-2 bg-slate-200 rounded cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) =>
                e.target.files &&
                e.target.files[0] &&
                importJSON(e.target.files[0])
              }
            />
          </label>
          <button
            onClick={clearAll}
            className="px-3 py-2 bg-red-600 text-white rounded ml-auto"
          >
            Clear All
          </button>
        </div>

        <ul className="divide-y border rounded">
          {employees.map((name, i) => (
            <li key={name} className="flex items-center gap-3 p-2">
              <span className="w-8 text-xs text-gray-500">{i + 1}</span>
              <span className="flex-1">{name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => move(i, -1)}
                  className="px-2 py-1 text-xs bg-gray-100 rounded"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  className="px-2 py-1 text-xs bg-gray-100 rounded"
                >
                  ↓
                </button>
                <button
                  onClick={() => remove(name)}
                  className="px-2 py-1 text-xs bg-rose-100 text-rose-700 rounded"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
          {employees.length === 0 && (
            <li className="p-4 text-sm text-gray-500">
              No employees yet. Add some above.
            </li>
          )}
        </ul>

        <p className="text-xs text-gray-500 mt-3">
          Saved locally to your browser as <code>boh_roster_v1</code>. The Game
          Plan page can read from this automatically.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={gamePlanRedirect}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded cursor-pointer"
          >
            Game plan
          </button>
        </div>
      </div>
    </div>
  );
}

export default RosterPage;
