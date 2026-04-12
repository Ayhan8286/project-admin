import React from "react";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, AlertCircle, MessageSquare, Clock } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  supervisorName?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, supervisorName }) => {
  const priorityColors = {
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    high: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";

  return (
    <div
      onClick={() => onClick(task)}
      className="group bg-white dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-4 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer relative overflow-hidden"
    >
      {isOverdue && (
        <div className="absolute top-0 right-0 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-bl-lg animate-pulse">
          OVERDUE
        </div>
      )}
      
      <div className="flex justify-between items-start mb-3">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full", priorityColors[task.priority])}>
          {task.priority}
        </span>
        <div className="flex items-center text-emerald-800/40 dark:text-emerald-200/40">
           {/* Placeholder for comment count if implemented in SQL later */}
           {/* <MessageSquare className="w-3 h-3 mr-1" />
           <span className="text-[10px]">3</span> */}
        </div>
      </div>

      <h4 className="text-sm font-semibold text-emerald-950 dark:text-emerald-50 mb-2 line-clamp-2 leading-tight">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-emerald-800/60 dark:text-emerald-200/60 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      <div className="pt-3 border-t border-emerald-100/50 dark:border-emerald-800/20 flex flex-wrap gap-2 items-center justify-between">
        {task.deadline && (
          <div className={cn(
            "flex items-center text-[10px] font-medium",
            isOverdue ? "text-rose-600 dark:text-rose-400" : "text-emerald-700/70 dark:text-emerald-300/70"
          )}>
            <Calendar className="w-3 h-3 mr-1" />
            {format(new Date(task.deadline), "MMM d")}
          </div>
        )}
        
        {supervisorName && (
          <div className="flex items-center bg-emerald-50 dark:bg-emerald-800/20 px-2 py-1 rounded-full text-[10px] text-emerald-800 dark:text-emerald-200">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-[8px] flex items-center justify-center text-white mr-1.5 font-bold">
              {supervisorName.charAt(0).toUpperCase()}
            </div>
            {supervisorName}
          </div>
        )}
      </div>

      {/* Quick Move Buttons */}
      <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status === 'todo' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClick({ ...task, status: 'in_progress' }); }}
            className="flex-1 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
          >
            <Clock className="w-3 h-3" />
            Start Task
          </button>
        )}
        {task.status === 'in_progress' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClick({ ...task, status: 'done' }); }}
            className="flex-1 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            Complete
          </button>
        )}
      </div>
    </div>
  );
};
