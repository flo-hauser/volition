export interface Task {
  id: string;
  title: string;
  targetPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  createdAt: string;
  archivedAt?: string;
}

export interface Checkin {
  taskId: string;
  day: string;
  checkedAt: string;
}
