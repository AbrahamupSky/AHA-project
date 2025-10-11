'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

const swalWithBootstrapButtons = Swal.mixin({
  customClass: {
    confirmButton: 'btn btn-success',
    cancelButton: 'btn btn-danger',
  },
  buttonsStyling: false,
});

type PositionKey =
  | 'primary'
  | 'buns'
  | 'secondary'
  | 'secondSecondary'
  | 'frys1'
  | 'frys2'
  | 'breading'
  | 'secondBreading'
  | 'machines'
  | 'rotation'
  | 'dishes'
  | 'eggs'
  | 'table1'
  | 'table2';

const POSITIONS: {
  key: PositionKey;
  label: string;
  color: string;
  height?: string;
  cap: number; // how many people can be assigned
}[] = [
  {
    key: 'frys1',
    label: 'Fries #1',
    color: 'bg-sky-200 border-sky-300',
    cap: 1,
  },
  {
    key: 'machines',
    label: 'Machines',
    color: 'bg-emerald-300 border-emerald-400',
    cap: 1,
  },
  {
    key: 'dishes',
    label: 'Dishes',
    color: 'bg-emerald-300 border-emerald-400',
    cap: 1,
  },
  {
    key: 'primary',
    label: 'Primary',
    color: 'bg-cyan-500 text-black border-cyan-600',
    height: 'h-20',
    cap: 3,
  },

  {
    key: 'secondary',
    label: 'Secondary',
    color: 'bg-rose-600 text-gray-700 border-rose-700',
    height: 'h-16',
    cap: 2,
  },

  {
    key: 'frys2',
    label: 'Fries #2',
    color: 'bg-sky-200 border-sky-300',
    cap: 1,
  },
  {
    key: 'breading',
    label: 'Breading',
    color: 'bg-amber-200 border-amber-300',
    cap: 3,
  },
  {
    key: 'eggs',
    label: 'Eggs',
    color: 'bg-rose-500 text-white border-rose-600',
    cap: 1,
  },
  { key: 'buns', label: 'Buns', color: 'bg-zinc-200 border-zinc-300', cap: 1 },
];

const removeEmployee = (name: string) => {
  setEmployees((prev) => prev.filter((e) => e !== name));
  // also unassign from board
  setGamePlan((prev) => {
    const updated: Record<PositionKey, string[]> = {} as any;
    for (const key in prev) {
      updated[key as PositionKey] = prev[key as PositionKey].filter(
        (p) => p !== name
      );
    }
    return updated;
  });
};

type PlanMap = Record<PositionKey, string[]>; // each holds up to cap

export default function BOHGamePlanBoard() {
  const [gamePlan, setGamePlan] = useState<Record<PositionKey, string[]>>(
    () => {
      const init: Record<PositionKey, string[]> = {} as any;
      POSITIONS.forEach((p) => (init[p.key] = []));
      return init;
    }
  );

  const [employees, setEmployees] = useState<string[]>([]);
  const [newEmployee, setNewEmployee] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('boh_gameplan_v2');
      if (!raw) return;
      const parsed = JSON.parse(raw);

      // SAFELY merge so every key exists as an array
      const loaded = (parsed?.gamePlan ?? {}) as Partial<
        Record<PositionKey, string[]>
      >;
      const merged: Record<PositionKey, string[]> = {} as any;
      POSITIONS.forEach((p) => {
        const val = loaded[p.key];
        merged[p.key] = Array.isArray(val) ? val : [];
      });

      setGamePlan(merged);
      if (typeof parsed?.notes === 'string') setNotes(parsed.notes); // ✅ correct setter
      if (Array.isArray(parsed?.employees)) setEmployees(parsed.employees); // ✅ correct setter
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(
      'boh_gameplan_v2',
      JSON.stringify({ gamePlan, notes, employees })
    );
    Swal.fire({
      title: 'Saved locally',
      icon: 'success',
    });
  };

  const clear = () => {
    swalWithBootstrapButtons
      .fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel!',
      })
      .then((result) => {
        if (result.isConfirmed) {
          const empty: Record<PositionKey, string[]> = {} as any;
          POSITIONS.forEach((p) => (empty[p.key] = []));
          setGamePlan(empty);
          setNotes('');
          setEmployees([]);
          swalWithBootstrapButtons.fire({
            title: 'Deleted!',
            text: 'All assignments have been cleared.',
            icon: 'success',
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire({
            title: 'Cancelled',
            text: 'Your data is safe.',
            icon: 'error',
          });
        }
      });
  };

  const addEmployee = () => {
    if (!newEmployee.trim()) return;
    if (employees.includes(newEmployee.trim())) return;
    setEmployees((prev) => [...prev, newEmployee.trim()]);
    setNewEmployee('');
  };

  const removeEmployee = (name: string) => {
    setEmployees((prev) => prev.filter((e) => e !== name));
    setGamePlan((prev) => {
      const updated: Record<PositionKey, string[]> = {} as any;
      for (const key in prev) {
        updated[key as PositionKey] = prev[key as PositionKey].filter(
          (p) => p !== name
        );
      }
      return updated;
    });
  };

  const onDragStartEmployee = (
    e: React.DragEvent<HTMLDivElement>,
    employee: string
  ) => {
    e.dataTransfer.setData('text/plain', employee);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropToPosition = (
    e: React.DragEvent<HTMLElement>,
    positionKey: PositionKey
  ) => {
    e.preventDefault();
    const employee = e.dataTransfer.getData('text/plain');
    if (!employee) return;
    setGamePlan((prev) => {
      const current = prev[positionKey];
      const cap = POSITIONS.find((p) => p.key === positionKey)?.capacity || 1;
      if (current.includes(employee)) return prev;
      if (current.length >= cap) return prev;
      return { ...prev, [positionKey]: [...current, employee] };
    });
  };

  const onAllowDrop = (e: React.DragEvent<HTMLDivElement>) =>
    e.preventDefault();

  const unassign = (positionKey: PositionKey, index?: number) => {
    setGamePlan((prev) => {
      if (index === undefined) return { ...prev, [positionKey]: [] };
      const arr = [...prev[positionKey]];
      arr.splice(index, 1);
      return { ...prev, [positionKey]: arr };
    });
  };

  const onDrop = (e: React.DragEvent, pos: PositionKey) => {
    e.preventDefault();
    const emp = e.dataTransfer.getData('text/plain');
    if (!emp) return;

    setGamePlan((prev) => {
      const cap = POSITIONS.find((p) => p.key === pos)!.cap;
      const next = { ...prev } as PlanMap;
      // ensure uniqueness
      (Object.keys(next) as PositionKey[]).forEach((k) => {
        next[k] = next[k].filter((e) => e !== emp);
      });
      const arr = [...next[pos]];
      if (arr.includes(emp)) return next; // already there
      if (arr.length < cap) {
        arr.push(emp);
      } else {
        // replace the first one if full
        arr[0] = emp;
      }
      next[pos] = arr;
      return next;
    });
  };
  const allow = (e: React.DragEvent) => e.preventDefault();
  const clearPos = (pos: PositionKey) =>
    setGamePlan((g) => ({ ...g, [pos]: [] }));

  const removeFromPos = (pos: PositionKey, emp: string) =>
    setGamePlan((g) => ({ ...g, [pos]: g[pos].filter((e) => e !== emp) }));

  const router = useRouter();
  const rosterRedirect = () => {
    router.push('/roster');
  };

  return (
    <div className="min-h-screen bg-neutral-400 p-6">
      <div className="mx-8 grid grid-cols-12 gap-6 text-gray-800">
        {/* ---- Left — Roster ---- */}
        <aside className="col-span-2">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">Employee Roster</h2>
            <div className="flex mb-2">
              <input
                type="text"
                value={newEmployee}
                onChange={(e) => setNewEmployee(e.target.value)}
                placeholder="Enter name"
                className="flex-1 border rounded-l p-2 px-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addEmployee();
                }}
              />
              <button
                onClick={addEmployee}
                className="bg-blue-600 text-white px-3 rounded-r sm:px-4 py-2 text-sm cursor-pointer"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {employees.map((emp) => (
                <div
                  key={emp}
                  draggable
                  onDragStart={(e) => onDragStartEmployee(e, emp)}
                  className="cursor-grab bg-white px-3 py-2 rounded-md shadow-sm flex justify-between items-center"
                >
                  <span>{emp}</span>
                  <button
                    onClick={() => removeEmployee(emp)}
                    className="text-xs text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mt-2 p-2 rounded border-gray-200"
                rows={6}
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={save}
                className="bg-green-600 text-white px-3 py-2 rounded text-sm flex-1"
              >
                Save
              </button>
              <button
                onClick={clear}
                className="bg-red-600 text-white px-3 py-2 rounded text-sm flex-1"
              >
                Clear All
              </button>
            </div>
          </div>
        </aside>

        {/* Center — Board layout */}
        <main className="col-span-8">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-3">BOH Game Plan</h2>

            <div className="grid grid-cols-6 grid-rows-6 gap-4">
              {/* ---- Frys ---- */}
              <BoardBox
                posKey="frys1"
                label="Fries #1"
                color="bg-sky-200 border-sky-300"
                className=""
                onDrop={onDrop}
                onDragOver={allow}
                people={gamePlan.frys1}
                cap={1}
                onClear={clearPos}
                onRemove={removeFromPos}
              />

              {/* ---- Machines ---- */}
              <BoardBox
                posKey="machines"
                label="Machines"
                color="bg-emerald-300 border-emerald-400"
                className="col-span-2 col-start-4"
                onDrop={onDrop}
                onDragOver={allow}
                people={gamePlan.machines}
                cap={1}
                onClear={clearPos}
                onRemove={removeFromPos}
              />

              {/* ---- Dishes ---- */}
              <BoardBox
                posKey="dishes"
                label="Dishes"
                color="bg-emerald-300 border-emerald-400"
                className="col-start-6"
                onDrop={onDrop}
                onDragOver={allow}
                people={gamePlan.dishes}
                cap={1}
                onClear={clearPos}
                onRemove={removeFromPos}
              />

              {/* Primary */}
              <BoardBox
                posKey="primary"
                label="Primary"
                color="bg-cyan-500  border-cyan-600"
                className="col-span-3 row-start-3"
                onDrop={onDrop}
                onDragOver={allow}
                people={gamePlan.primary}
                cap={3}
                onClear={clearPos}
                onRemove={removeFromPos}
              />

              {/* Breading */}
              <BoardBox
                posKey="breading"
                label="Breading"
                color="bg-amber-200 border-amber-300"
                className="col-span-3 col-start-4 row-start-3"
                onDrop={onDrop}
                onDragOver={allow}
                people={gamePlan.breading}
                cap={3}
                onClear={clearPos}
                onRemove={removeFromPos}
              />

              {/* Secondary */}
              <BoardBox
                posKey="secondary"
                label="Secondary"
                color="bg-rose-600 border-rose-700"
                className="col-span-3 row-start-4"
                onDrop={onDrop}
                onDragOver={allow}
                people={gamePlan.secondary}
                cap={2}
                onClear={clearPos}
                onRemove={removeFromPos}
              />

              {/* ---- Frys 2 ---- */}
              <BoardBox
                posKey="frys2"
                label="Fries #2"
                color="bg-sky-200 border-sky-300"
                className="row-start-6"
                onDrop={onDrop}
                onDragOver={allow}
                people={gamePlan.frys2}
                cap={1}
                onClear={clearPos}
                onRemove={removeFromPos}
              />

              {/* ---- Eggs ---- */}
              <BoardBox
                posKey="eggs"
                label="Eggs"
                color="bg-rose-500 text-white border-rose-600"
                className="col-start-4 row-start-6"
                onDrop={onDrop}
                onDragOver={allow}
                people={gamePlan.eggs}
                cap={1}
                onClear={clearPos}
                onRemove={removeFromPos}
              />
            </div>
          </div>
        </main>

        {/* ---- Right side ---- */}

        <aside className="col-span-2">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-3">Assigned Summary</h2>
            <ul className="space-y-2 text-sm">
              {POSITIONS.map((p) => (
                <li key={p.key} className="flex justify-between">
                  <span>{p.label}</span>
                  <span className="font-medium">
                    {(gamePlan[p.key] ?? []).join(', ') || '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Reusable board box that supports capacity > 1 */
function BoardBox({
  posKey,
  label,
  color,
  className,
  onDrop,
  onDragOver,
  people,
  cap,
  onClear,
  onRemove,
}: {
  posKey: PositionKey;
  label: string;
  color: string;
  className?: string;
  onDrop: (e: React.DragEvent, pos: PositionKey) => void;
  onDragOver: (e: React.DragEvent) => void;
  people?: string[]; // <- make optional
  cap?: number; // <- make optional
  onClear: (pos: PositionKey) => void;
  onRemove: (pos: PositionKey, emp: string) => void;
}) {
  const list = people ?? []; // <- default
  const capacity = cap ?? 1; // <- default

  return (
    <div
      onDrop={(e) => onDrop(e, posKey)}
      onDragOver={onDragOver}
      className={`rounded-md border ${color} ${className} p-2 min-h-[64px] flex flex-col`}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] opacity-70">
            {list.length}/{capacity} {/* <- use list */}
          </span>
          <button
            onClick={() => onClear(posKey)}
            className="text-[11px] text-rose-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div
        className={`mt-2 grid gap-3 ${
          capacity === 3
            ? 'grid-cols-3'
            : capacity === 2
            ? 'grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {Array.from({ length: capacity }).map((_, i) => {
          const person = list[i];
          return (
            <div
              key={i}
              className="bg-white/70 rounded px-2 py-1 text-sm shadow-inner min-h-[36px] flex items-center justify-between"
            >
              {person ? (
                <>
                  <span>{person}</span>
                  <button
                    className="text-[11px] text-gray-500"
                    onClick={() => onRemove(posKey, person)}
                  >
                    remove
                  </button>
                </>
              ) : (
                <span className="text-xs text-black/40">Drop here</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
