
export interface Task {
  id: string;
  content: string;
  plannedMinutes: number;
  actualMinutes: number;
}

export interface DailyLog {
  date: string;
  bestGoal: number;
  minGoal: number;
  tasks: Task[];
  comment: string;
  aiCoachComment: string;
}

export interface WeeklyGoal {
  id:string;
  title: string;
}

export interface AppData {
  yearGoal: string;
  startDate: string;
  weeklyGoals: WeeklyGoal[];
  logs: {
    [weekId: string]: DailyLog[];
  };
}
