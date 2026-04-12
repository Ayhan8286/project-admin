export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    deadline: string | null;
    supervisor_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface TaskComment {
    id: string;
    task_id: string;
    user_id: string;
    user_name: string;
    user_role: string;
    content: string;
    created_at: string;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    deadline?: string;
    supervisor_id?: string;
    created_by?: string;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    deadline?: string;
    supervisor_id?: string;
}
