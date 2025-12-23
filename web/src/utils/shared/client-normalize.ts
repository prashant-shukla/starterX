// Normalization helpers for admin client workflow/task shapes
// Converts loose shapes (completed: number | boolean, subtasks: string[] | {name, completed}[]) into
// a canonical runtime shape used by the UI: { name, completed: boolean, subtasks: { name, completed }[] }

export type CanonicalSubtask = { name: string; completed: boolean }
export type CanonicalTask = { name?: string; completed: boolean; subtasks: CanonicalSubtask[] }

export function normalizeTask(task: any, defaultTask?: CanonicalTask): CanonicalTask {
  const base: CanonicalTask = {
    name: task?.name || defaultTask?.name || '',
    completed: false,
    subtasks: []
  };

  if (task == null) {
    return defaultTask ? { ...defaultTask } : base;
  }

  // Determine completed flag: numeric >0 or boolean true => true
  if (typeof task.completed === 'boolean') {
    base.completed = task.completed;
  } else if (typeof task.completed === 'number') {
    base.completed = task.completed > 0;
  } else if (task.subtasks && Array.isArray(task.subtasks)) {
    // If subtasks exist and all subtasks completed, mark completed
    const subtasksAllCompleted = task.subtasks.every((st: any) => !!st?.completed);
    base.completed = subtasksAllCompleted;
  }

  // Normalize subtasks: strings -> {name, completed:false}, objects -> keep name/completed
  if (task.subtasks && Array.isArray(task.subtasks)) {
    base.subtasks = task.subtasks.map((st: any) => {
      if (typeof st === 'string') return { name: st, completed: false };
      return { name: st?.name || st?.title || '', completed: !!st?.completed };
    });
  } else if (Array.isArray(defaultTask?.subtasks) && defaultTask) {
    base.subtasks = defaultTask.subtasks.map(s => ({ ...s }));
  }

  return base;
}

export function normalizeTasksMap(tasks: Record<string, any> | any, defaults?: Record<string, CanonicalTask>) {
  const requiredKeys = ['generalTasks', 'categorization', 'reconciliation', 'review'];
  const result: Record<string, CanonicalTask> = {};

  requiredKeys.forEach(k => {
    const defaultTask = defaults?.[k];
    result[k] = normalizeTask(tasks?.[k] || {}, defaultTask);
  });

  return result;
}

export function asNumber(x: any, fallback = 0): number {
  if (typeof x === 'number') return x
  const n = Number(x)
  return Number.isFinite(n) ? n : fallback
}
