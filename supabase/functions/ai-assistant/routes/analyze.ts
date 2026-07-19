import { chatWithFallback } from '../services/aiService.ts';
import { fetchUserStudyData } from '../services/userDataService.ts';
import { validateAnalyzeRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

/**
 * برخی مدل‌ها پاسخ JSON را داخل فنس ```json ... ``` برمی‌گردانند حتی وقتی
 * درخواست شده خروجی خام JSON باشد. قبل از JSON.parse این فنس را حذف
 * می‌کنیم تا سمت کلاینت هرگز مجبور به دیدن متن خام (شامل ```json) نشود.
 */
function stripCodeFence(raw: string): string {
    const trimmed = raw.trim();
    const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
    return match ? match[1].trim() : trimmed;
}

export async function handleAnalyze(data: unknown) {
    try {
        const { userId, period } = validateAnalyzeRequest(data);
        const userData = await fetchUserStudyData(userId);

        const prompt = `
You are an AI study coach. Analyze the following student data and provide a concise performance analysis.

Data (last ${period}):
- Total study sessions: ${userData.totalSessions}
- Total minutes studied: ${userData.totalMinutes}
- Average daily minutes: ${userData.averageDailyMinutes}
- Days active: ${userData.daysActive}
- Current streak: ${userData.currentStreak} days
- Longest streak: ${userData.longestStreak} days
- Top subjects: ${userData.topSubjects.map(s => `${s.name} (${s.minutes} min)`).join(', ')}
- Average test score: ${userData.averageTestScore}%
- Recent test scores: ${userData.recentTestScores.map(t => `${t.name}: ${t.score}/${t.maxScore}`).join(', ')}
- Goals: ${userData.goalProgress.map(g => `${g.title} (${g.progress}%)`).join(', ')}

Provide:
1. A one-sentence summary of the student's overall performance.
2. Three key strengths.
3. Three areas for improvement (weaknesses).
4. Three specific, actionable recommendations to improve.

Respond with ONLY a raw JSON object (no markdown code fences, no commentary) with keys: summary, strengths (array), weaknesses (array), recommendations (array).
Keep it concise and focused.
    `;

        const result = await chatWithFallback(
            [
                { role: 'system', content: 'You are a helpful study coach. Respond with ONLY raw JSON, never wrap it in markdown code fences.' },
                { role: 'user', content: prompt },
            ],
            { maxTokens: 800, temperature: 0.6 },
            userId
        );

        const cleaned = stripCodeFence(result.content);

        let parsed: any;
        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            logger.warn('Failed to parse analysis JSON, returning raw text as summary only');
            // حتی در بدترین حالت هم متن خام JSON/فنس‌دار به کلاینت برنمی‌گردد؛
            // فقط متن پاک‌شده از فنس کد به‌عنوان خلاصه برمی‌گردد و کلاینت هم
            // لایه دفاعی دوم (sanitizeAiResponse) را روی آن اجرا می‌کند.
            return {
                success: true,
                data: { summary: cleaned, strengths: [], weaknesses: [], recommendations: [] },
                provider: result.provider,
            };
        }

        return {
            success: true,
            data: {
                summary: parsed.summary || '',
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
            },
            provider: result.provider,
        };
    } catch (error) {
        logger.error('Analyze handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}