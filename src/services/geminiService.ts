
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { DailyLog, WeeklyGoal } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export async function getAICoachComment(
  dailyLog: DailyLog,
  weeklyGoal: WeeklyGoal
): Promise<string> {
  try {
    const totalActualMinutes = dailyLog.tasks.reduce((sum, task) => sum + task.actualMinutes, 0);
    const totalPlannedMinutes = dailyLog.tasks.reduce((sum, task) => sum + task.plannedMinutes, 0);
    const tasksString = dailyLog.tasks
      .map(t => `- ${t.content}: 計画${t.plannedMinutes}分, 実績${t.actualMinutes}分`)
      .join('\n');

    const prompt = `
      あなたは支援的で励みになる学習コーチです。あなたの目標は、ユーザーが学習を続けるように動機付けることです。
      以下の今日の学習ログを分析し、短く、肯定的で、建設的なコメントを日本語で提供してください。

      ## 状況
      - 今週の目標: ${weeklyGoal.title}
      - 今日の目標 (ベスト): ${dailyLog.bestGoal}分
      - 今日の目標 (ミニマム): ${dailyLog.minGoal}分
      - 今日の総計画学習時間: ${totalPlannedMinutes}分
      - 今日の総実績学習時間: ${totalActualMinutes}分
      - ユーザーのコメント: "${dailyLog.comment}"
      - 取り組んだタスク:
      ${tasksString || 'なし'}

      ## 指示
      - 計画と実績を比較し、計画通りまたはそれ以上にできた場合は特に褒めてください。
      - 総実績学習時間がミニマム目標を達成した場合、その努力を褒めてください。
      - ベスト目標を達成した場合は、非常に熱心に祝福してください。
      - ミニマム目標に届かなかった場合は、優しく励まし、明日のための小さなステップを提案してください。
      - ユーザーのコメントや具体的なタスク内容にも触れて、パーソナライズされたフィードバックを心がけてください。
      - 全体的に、フレンドリーでやる気の出るトーンを保ってください。
      - 応答はコーチからのコメントのみとし、前置きは不要です。
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text?.trim() || '';
  } catch (error) {
    console.error("Error generating AI coach comment:", error);
    if (error instanceof Error) {
        return `コメントの生成に失敗しました: ${error.message}`;
    }
    return "コメントの生成中に不明なエラーが発生しました。";
  }
}
