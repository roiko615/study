
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { AppData, DailyLog, Task, WeeklyGoal } from './types';
import { getAICoachComment } from './services/geminiService';

// --- Helper Functions ---
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const generateInitialData = (startDateStr: string): AppData => {
  const startDate = new Date(startDateStr + 'T00:00:00'); // Ensure local timezone
  const weeklyGoals: WeeklyGoal[] = Array.from({ length: 52 }, (_, i) => ({ // Extended to 52 weeks
    id: `week${i + 1}`,
    title: '',
  }));

  const logs: AppData['logs'] = {};
  let currentStartDate = new Date(startDate);

  weeklyGoals.forEach((week) => {
    logs[week.id] = [];
    for (let i = 0; i < 7; i++) {
      logs[week.id].push({
        date: formatDate(addDays(currentStartDate, i)),
        bestGoal: 0,
        minGoal: 0,
        tasks: [],
        comment: '',
        aiCoachComment: '',
      });
    }
    currentStartDate = addDays(currentStartDate, 7);
  });
  
  return {
    yearGoal: '',
    startDate: startDateStr,
    weeklyGoals,
    logs,
  };
};

// --- Icon Components ---
const MenuIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const PlusIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SparklesIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m11-1a2 2 0 00-2-2h-1a2 2 0 00-2 2v1a2 2 0 002 2h1a2 2 0 002-2v-1zM14 5a2 2 0 00-2-2h-1a2 2 0 00-2 2v1a2 2 0 002 2h1a2 2 0 002-2V5z" />
    </svg>
);

const CalendarIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const HomeIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const TrophyIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19c-5 1.5-5-2.5-7-3m14 3c-5 1.5-5-2.5-7-3m7 3v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5m10 0h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2m4-12h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
);

const ClipboardListIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


// --- UI Components ---
const Header: React.FC<{ yearGoal: string; onYearGoalChange: (goal: string) => void; onToggleSidebar: () => void; }> = ({ yearGoal, onYearGoalChange, onToggleSidebar }) => (
  <header className="bg-white shadow-md p-4 sticky top-0 z-20">
    <div className="container mx-auto flex items-center gap-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Toggle sidebar"
      >
        <MenuIcon className="w-6 h-6" />
      </button>
      <h1 className="text-2xl font-bold text-slate-800 whitespace-nowrap">StudySheet</h1>
      <input
        type="text"
        value={yearGoal}
        onChange={(e) => onYearGoalChange(e.target.value)}
        className="w-full bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 rounded-lg px-4 py-2 text-xl font-semibold text-slate-700 transition"
        placeholder="Set your ultimate goal for the year"
      />
    </div>
  </header>
);

const WeeklyGoalSidebar: React.FC<{
  weeklyGoals: WeeklyGoal[];
  selectedView: string;
  currentWeekId: string | undefined;
  onSelectView: (id: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  onWeeklyGoalChange: (weekId: string, title: string) => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isOpen: boolean;
}> = ({ weeklyGoals, selectedView, currentWeekId, onSelectView, startDate, onStartDateChange, onWeeklyGoalChange, onExport, onImport, isOpen }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
  <aside className={`bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out overflow-x-hidden ${isOpen ? 'w-80 p-4 space-y-4' : 'w-0 p-0 space-y-0 border-r-0'}`}>
    <div className="relative">
        <label htmlFor="start-date" className="block text-sm font-medium text-slate-600 mb-1">記録開始日</label>
        <CalendarIcon className="w-5 h-5 absolute left-3 top-9 text-slate-400" />
        <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
    </div>
    <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Menu</h2>
     <div
          onClick={() => onSelectView('home')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectView('home'); }}
          role="button"
          tabIndex={0}
          aria-pressed={selectedView === 'home'}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-3 cursor-pointer ${
            selectedView === 'home' 
              ? 'bg-indigo-500 text-white shadow' 
              : 'text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span>Home</span>
        </div>
    <nav className="space-y-1 flex-1 overflow-y-auto">
      {weeklyGoals.map(week => (
        <div
          key={week.id}
          onClick={() => onSelectView(week.id)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectView(week.id); }}
          role="button"
          tabIndex={0}
          aria-pressed={selectedView === week.id}
          className={`w-full text-left px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer relative ${
            selectedView === week.id 
              ? 'bg-indigo-500 text-white shadow' 
              : 'text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          } ${
            week.id === currentWeekId ? 'ring-2 ring-offset-1 ring-sky-400' : ''
          }`}
        >
          <span className="font-bold">#{week.id.replace('week', '')}</span>
          <input
            type="text"
            value={week.title}
            onChange={(e) => onWeeklyGoalChange(week.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Goal for ${week.id}`}
            placeholder="Set weekly goal"
            className={`w-full bg-transparent focus:ring-0 border-0 p-1 ${
              selectedView === week.id ? 'text-white placeholder-indigo-200' : 'text-slate-700 placeholder-slate-400'
            }`}
          />
        </div>
      ))}
    </nav>
     <div className="pt-4 border-t space-y-2">
        <h3 className="text-sm font-semibold text-slate-600">Data Management</h3>
        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
          <span>Export Data</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <UploadIcon className="w-4 h-4" />
          <span>Import Data</span>
        </button>
        <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
      </div>
  </aside>
  );
};

const TaskItem: React.FC<{ task: Task; onUpdate: (task: Task) => void; onDelete: () => void }> = ({ task, onUpdate, onDelete }) => {
    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={task.content}
                onChange={e => onUpdate({ ...task, content: e.target.value })}
                className="flex-grow bg-slate-50 border-slate-200 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="勉強内容"
            />
            <input
                type="number"
                value={task.plannedMinutes === 0 ? '' : task.plannedMinutes}
                onChange={e => onUpdate({ ...task, plannedMinutes: parseInt(e.target.value) || 0 })}
                className="w-24 bg-slate-50 border-slate-200 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="計画(分)"
            />
            <input
                type="number"
                value={task.actualMinutes === 0 ? '' : task.actualMinutes}
                onChange={e => onUpdate({ ...task, actualMinutes: parseInt(e.target.value) || 0 })}
                className="w-24 bg-slate-50 border-slate-200 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="実績(分)"
            />
            <button onClick={onDelete} aria-label="Delete task" className="p-1 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors">
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const DailyLogCard: React.FC<{
  log: DailyLog;
  onUpdate: (log: DailyLog) => void;
  onDeleteTask: (taskId: string) => void;
  onGetAICoachComment: () => void;
  isGeneratingComment: boolean;
}> = ({ log, onUpdate, onDeleteTask, onGetAICoachComment, isGeneratingComment }) => {
  
  const handleTaskUpdate = (updatedTask: Task) => {
    const newTasks = log.tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    onUpdate({ ...log, tasks: newTasks });
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random()}`, // Added random for better uniqueness
      content: '',
      plannedMinutes: 0,
      actualMinutes: 0,
    };
    onUpdate({ ...log, tasks: [...log.tasks, newTask] });
  };
  
  const totalPlannedMinutes = log.tasks.reduce((sum, task) => sum + task.plannedMinutes, 0);
  const totalActualMinutes = log.tasks.reduce((sum, task) => sum + task.actualMinutes, 0);
  const dayOfWeek = new Date(log.date + 'T00:00:00').toLocaleDateString('ja-JP', { weekday: 'short' });

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-3">
      <h3 className="font-bold text-lg text-slate-700">{log.date} ({dayOfWeek})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Goal inputs */}
        <div className="flex items-center gap-2">
          <label htmlFor={`minGoal-${log.date}`} className="text-sm font-medium text-slate-600 whitespace-nowrap">最低目標(分):</label>
          <input
            id={`minGoal-${log.date}`}
            type="number"
            value={log.minGoal === 0 ? '' : log.minGoal}
            onChange={e => onUpdate({ ...log, minGoal: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-100 border-slate-200 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`bestGoal-${log.date}`} className="text-sm font-medium text-slate-600 whitespace-nowrap">最高目標(分):</label>
          <input
            id={`bestGoal-${log.date}`}
            type="number"
            value={log.bestGoal === 0 ? '' : log.bestGoal}
            onChange={e => onUpdate({ ...log, bestGoal: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-100 border-slate-200 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <div className="flex-grow">勉強内容</div>
              <div className="w-24 text-right">計画(分)</div>
              <div className="w-24 text-right pr-5">実績(分)</div>
          </div>
          {log.tasks.map(task => (
              <TaskItem key={task.id} task={task} onUpdate={handleTaskUpdate} onDelete={() => onDeleteTask(task.id)} />
          ))}
      </div>
       <button
        onClick={handleAddTask}
        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 rounded-md hover:bg-indigo-50 transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        <span>タスクを追加</span>
      </button>

      {/* Totals */}
      <div className="text-right font-bold text-slate-600 pr-8 border-t pt-2">
        合計: 計画 {totalPlannedMinutes}分 / 実績 {totalActualMinutes}分
      </div>

      {/* Comment */}
      <div>
        <label htmlFor={`comment-${log.date}`} className="text-sm font-medium text-slate-600">今日の振り返り</label>
        <textarea
            id={`comment-${log.date}`}
            value={log.comment}
            onChange={e => onUpdate({ ...log, comment: e.target.value })}
            rows={2}
            className="mt-1 w-full bg-slate-100 border-slate-200 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="今日の学習で感じたこと、気づいたことなどを記録しましょう。"
        />
      </div>

      {/* AI Coach */}
      <div className="space-y-2">
          <button
            onClick={onGetAICoachComment}
            disabled={isGeneratingComment}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{isGeneratingComment ? 'コーチが考えています...' : 'AIコーチからフィードバックをもらう'}</span>
          </button>
          {log.aiCoachComment && (
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-3 rounded-r-lg">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{log.aiCoachComment}</p>
            </div>
          )}
      </div>
    </div>
  );
};

const WeeklySummary: React.FC<{ logs: DailyLog[] }> = ({ logs }) => {
  const weeklyTotalPlanned = logs.reduce((total, log) => total + log.tasks.reduce((sum, task) => sum + task.plannedMinutes, 0), 0);
  const weeklyTotalActual = logs.reduce((total, log) => total + log.tasks.reduce((sum, task) => sum + task.actualMinutes, 0), 0);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Weekly Summary</h3>
      <div className="flex justify-around items-center">
        <div className="text-center">
          <p className="text-sm text-slate-500">Total Planned</p>
          <p className="text-2xl font-bold text-slate-700">{weeklyTotalPlanned} <span className="text-base font-normal">min</span></p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500">Total Actual</p>
          <p className="text-2xl font-bold text-indigo-600">{weeklyTotalActual} <span className="text-base font-normal">min</span></p>
        </div>
      </div>
    </div>
  );
};

const WeeklyView: React.FC<{
  logs: DailyLog[];
  onUpdateLog: (log: DailyLog) => void;
  onDeleteTask: (date: string, taskId: string) => void;
  onGetAICoachComment: (date: string) => void;
  generatingCommentFor: string | null;
}> = ({ logs, onUpdateLog, onDeleteTask, onGetAICoachComment, generatingCommentFor }) => {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4">
      <WeeklySummary logs={logs} />
      {logs.map(log => (
        <DailyLogCard
          key={log.date}
          log={log}
          onUpdate={onUpdateLog}
          onDeleteTask={(taskId) => onDeleteTask(log.date, taskId)}
          onGetAICoachComment={() => onGetAICoachComment(log.date)}
          isGeneratingComment={generatingCommentFor === log.date}
        />
      ))}
    </div>
  );
};

const HomeScreen: React.FC<{
    yearGoal: string;
    weeklyGoal: WeeklyGoal | undefined;
    todayLog: DailyLog | undefined;
}> = ({ yearGoal, weeklyGoal, todayLog }) => {

    const todayProgress = todayLog ? (todayLog.tasks.reduce((sum, t) => sum + t.actualMinutes, 0) / (todayLog.bestGoal || 1)) * 100 : 0;
    const progressPercentage = Math.min(100, Math.max(0, todayProgress));


    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">ホーム</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Year Goal */}
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <TrophyIcon className="w-8 h-8 text-amber-500" />
                        <h3 className="text-xl font-semibold text-slate-700">今年の目標</h3>
                    </div>
                    <p className="text-slate-600 flex-grow">{yearGoal || "今年の目標を設定しましょう。"}</p>
                </div>

                {/* This Week's Goal */}
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                         <ClipboardListIcon className="w-8 h-8 text-sky-500" />
                        <h3 className="text-xl font-semibold text-slate-700">今週の目標: #{weeklyGoal?.id.replace('week','')}</h3>
                    </div>
                    <p className="text-slate-600 flex-grow">{weeklyGoal?.title || "今週の目標を設定しましょう。"}</p>
                </div>
            </div>

            {/* Today's Progress */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <h3 className="text-xl font-semibold text-slate-700 mb-4">今日の進捗</h3>
                 {todayLog ? (
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1 text-sm font-medium text-slate-600">
                                <span>実績 / 最高目標</span>
                                <span>{todayLog.tasks.reduce((sum, t) => sum + t.actualMinutes, 0)} / {todayLog.bestGoal} 分</span>
                            </div>
                             <div className="w-full bg-slate-200 rounded-full h-4">
                                <div 
                                    className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out" 
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-slate-600 mb-2">今日のタスク</h4>
                            <ul className="list-disc list-inside space-y-1 text-slate-500">
                                {todayLog.tasks.length > 0 ? todayLog.tasks.map(task => (
                                    <li key={task.id}>
                                        {task.content || "未入力のタスク"}: 実績 {task.actualMinutes}分 / 計画 {task.plannedMinutes}分
                                    </li>
                                )) : (
                                    <li>今日のタスクはまだありません。</li>
                                )}
                            </ul>
                        </div>
                    </div>
                 ) : (
                    <p className="text-slate-500">今日の学習データがありません。</p>
                 )}
            </div>

        </div>
    );
};


const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [selectedView, setSelectedView] = useState('home'); // 'home' or a weekId like 'week1'
  const [generatingCommentFor, setGeneratingCommentFor] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    try {
        const savedState = localStorage.getItem('sidebarOpen');
        return savedState ? JSON.parse(savedState) : true;
    } catch (error) {
        console.error("Could not parse sidebar state from localStorage", error);
        return true;
    }

  useEffect(() => {
    try {
        localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
    } catch (error) {
        console.error("Could not save sidebar state to localStorage", error);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    // Load data from localStorage or generate initial data
    try {
      const savedData = localStorage.getItem('studySheetData');
      if (savedData) {
        setAppData(JSON.parse(savedData));
      } else {
        const today = formatDate(new Date());
        setAppData(generateInitialData(today));
      }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        const today = formatDate(new Date());
        setAppData(generateInitialData(today));
    }
  }, []);

  useEffect(() => {
    // Save data to localStorage whenever it changes
    if (appData) {
      localStorage.setItem('studySheetData', JSON.stringify(appData));
    }
  }, [appData]);

  const handleToggleSidebar = useCallback(() => {
  setIsSidebarOpen(prev => !prev);
  }, []);

  const handleYearGoalChange = useCallback((goal: string) => {
    setAppData(prev => prev ? { ...prev, yearGoal: goal } : null);
  }, []);
  
  const handleStartDateChange = useCallback((dateStr: string) => {
      if(window.confirm("開始日を変更すると、すべてのログデータがリセットされます。よろしいですか？")) {
        setAppData(generateInitialData(dateStr));
        setSelectedView('home'); // Reset to home view when date changes
      }
  }, []);
  
  const handleWeeklyGoalChange = useCallback((weekId: string, title: string) => {
      setAppData(prev => {
          if (!prev) return null;
          const newWeeklyGoals = prev.weeklyGoals.map(wg => 
              wg.id === weekId ? { ...wg, title } : wg
          );
          return { ...prev, weeklyGoals: newWeeklyGoals };
      });
  }, []);

  const handleUpdateLog = useCallback((updatedLog: DailyLog) => {
    setAppData(prev => {
      if (!prev) return null;
      const newLogs = { ...prev.logs };
      for (const weekId in newLogs) {
        const dayIndex = newLogs[weekId].findIndex(d => d.date === updatedLog.date);
        if (dayIndex !== -1) {
          newLogs[weekId][dayIndex] = updatedLog;
          break;
        }
      }
      return { ...prev, logs: newLogs };
    });
  }, []);
  
  const handleDeleteTask = useCallback((date: string, taskId: string) => {
    setAppData(prev => {
      if (!prev) return null;
      const newLogs = { ...prev.logs };
      let updated = false;
       for (const weekId in newLogs) {
        const dayIndex = newLogs[weekId].findIndex(d => d.date === date);
        if (dayIndex !== -1) {
          const originalTasks = newLogs[weekId][dayIndex].tasks;
          newLogs[weekId][dayIndex].tasks = originalTasks.filter(t => t.id !== taskId);
          updated = true;
          break;
        }
      }
      if (updated) {
        return { ...prev, logs: newLogs };
      }
      return prev;
    });
  }, []);

  const handleGetAICoachComment = useCallback(async (date: string) => {
    if (!appData) return;
    const weekId = Object.keys(appData.logs).find(weekId => appData.logs[weekId].some(log => log.date === date));
    if (!weekId) return;

    const dailyLog = appData.logs[weekId].find(log => log.date === date);
    const weeklyGoal = appData.weeklyGoals.find(wg => wg.id === weekId);

    if (dailyLog && weeklyGoal) {
      setGeneratingCommentFor(date);
      try {
        const comment = await getAICoachComment(dailyLog, weeklyGoal);
        handleUpdateLog({ ...dailyLog, aiCoachComment: comment });
      } catch (error) {
        console.error("Failed to get AI coach comment", error);
        handleUpdateLog({ ...dailyLog, aiCoachComment: "エラーが発生しました。もう一度お試しください。" });
      } finally {
        setGeneratingCommentFor(null);
      }
    }
  }, [appData, handleUpdateLog]);
  
  const handleExportData = useCallback(() => {
    if (!appData) return;
    try {
      const jsonString = JSON.stringify(appData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `study-sheet-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch(error) {
        alert("Failed to export data.");
        console.error("Export failed", error);
    }
  }, [appData]);

  const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("現在のデータを上書きして、選択したファイルをインポートしますか？")) {
        event.target.value = ''; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("File is not readable");
            const importedData = JSON.parse(text);
            // Basic validation
            if (importedData.yearGoal !== undefined && importedData.logs && importedData.weeklyGoals) {
                setAppData(importedData as AppData);
                setSelectedView('home');
            } else {
                throw new Error("Invalid data structure");
            }
        } catch (error) {
            alert("ファイルの読み込みに失敗しました。有効なJSONファイルか確認してください。");
            console.error("Import failed", error);
        } finally {
             event.target.value = ''; // Reset file input
        }
    };
    reader.readAsText(file);
  }, []);

  const getTodayLogAndWeekId = useMemo(() => {
      if (!appData) return { todayLog: undefined, weekId: undefined };
      const todayStr = formatDate(new Date());
      for (const weekId in appData.logs) {
          const log = appData.logs[weekId].find(d => d.date === todayStr);
          if (log) {
              return { todayLog: log, weekId: weekId };
          }
      }
      return { todayLog: undefined, weekId: undefined };
  }, [appData]);
  
  const { todayLog, weekId: currentWeekId } = getTodayLogAndWeekId;

  const currentLogs = useMemo(() => {
    if (!appData || selectedView === 'home' || !appData.logs[selectedView]) {
      return [];
    }
    return appData.logs[selectedView];
  }, [appData, selectedView]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <WeeklyGoalSidebar
        weeklyGoals={appData?.weeklyGoals || []}
        selectedView={selectedView}
        currentWeekId={currentWeekId}
        onSelectView={setSelectedView}
        startDate={appData?.startDate || ""}
        onStartDateChange={handleStartDateChange}
        onWeeklyGoalChange={handleWeeklyGoalChange}
        onExport={handleExportData}
        onImport={handleImportData}
        isOpen={isSidebarOpen}
      />
      <div className="flex-1 flex flex-col h-screen min-w-0">
        <Header 
          yearGoal={appData?.yearGoal || ""} 
          onYearGoalChange={handleYearGoalChange}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="flex-1 overflow-y-auto">
          {selectedView === 'home' ? (
            <HomeScreen 
              yearGoal={appData?.yearGoal || ""}
              weeklyGoal={appData?.weeklyGoals.find(wg => wg.id === currentWeekId)}
              todayLog={todayLog}
            />
          ) : (
            <WeeklyView
              logs={currentLogs}
              onUpdateLog={handleUpdateLog}
              onDeleteTask={handleDeleteTask}
              onGetAICoachComment={handleGetAICoachComment}
              generatingCommentFor={generatingCommentFor}
            />
          )}
        </main>
      </div>
    </div>
  );
}; 

export default App;
