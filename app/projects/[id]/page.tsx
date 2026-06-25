"use client";

export default function Board() {
  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <div className="flex gap-5 overflow-x-auto">

        <div className="w-80 bg-white rounded-lg p-4">
          <h2 className="font-bold mb-4">Todo</h2>

          <div className="bg-slate-50 p-3 rounded border">
            <div className="font-medium">
              PROJ-1 Login Page
            </div>

            <div className="text-xs mt-2 text-red-500">
              HIGH
            </div>
          </div>
        </div>

        <div className="w-80 bg-white rounded-lg p-4">
          <h2 className="font-bold mb-4">
            In Progress
          </h2>
        </div>

        <div className="w-80 bg-white rounded-lg p-4">
          <h2 className="font-bold mb-4">
            Done
          </h2>
        </div>

      </div>
    </div>
  );
}