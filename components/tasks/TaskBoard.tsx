import React from "react";
import { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { Supervisor } from "@/types/supervisor";
import { Plus, MoreHorizontal, CircleSlash2 } from "lucide-react";

interface TaskBoardProps {
  tasks: Task[];
  supervisors: Supervisor[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  isLoading?: boolean;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ 
  tasks, 
  supervisors, 
  onTaskClick, 
  onAddTask,
  isLoading 
}) => {
  const columns: { label: string; status: TaskStatus; icon: string }[] = [
    { label: "To Do", status: "todo", icon: "assignment" },
    { label: "In Progress", status: "in_progress", icon: "trending_up" },
    { label: "Done", status: "done", icon: "check_circle" },
  ];

  const getSupervisorName = (id: string | null) => {
    if (!id) return "Unassigned";
    const sup = supervisors.find(s => s.id === id);
    return sup ? sup.name : "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px] overflow-x-auto pb-8 snap-x">
      {columns.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.status);
        
        return (
          <div 
            key={column.status} 
            className="flex flex-col h-full min-w-[300px] snap-center"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl font-medium">
                  {column.icon}
                </span>
                <h3 className="font-bold text-emerald-950 dark:text-emerald-50 tracking-tight">
                  {column.label}
                </h3>
                <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              <button 
                onClick={() => onAddTask(column.status)}
                className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 rounded-lg text-emerald-800 dark:text-emerald-200 transition-colors"
                title={`Add task to ${column.label}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 bg-emerald-50/50 dark:bg-black/20 rounded-2xl p-3 border border-emerald-100/50 dark:border-white/5 space-y-4 overflow-y-auto custom-scrollbar max-h-[calc(100vh-250px)]">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={onTaskClick} 
                    supervisorName={getSupervisorName(task.supervisor_id)}
                  />
                ))
              ) : (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-emerald-200/50 dark:border-white/5 rounded-2x text-emerald-800/30 dark:text-emerald-200/20 text-xs">
                  <CircleSlash2 className="w-8 h-8 mb-2 opacity-50" />
                  No tasks in this stage
                </div>
              )}
              
              <button 
                onClick={() => onAddTask(column.status)}
                className="w-full py-2 flex items-center justify-center space-x-2 text-xs font-semibold text-emerald-700/60 dark:text-emerald-300/40 hover:text-emerald-900 dark:hover:text-emerald-50 hover:bg-emerald-100/30 dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-emerald-200/50"
              >
                <Plus className="w-3 h-3" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
