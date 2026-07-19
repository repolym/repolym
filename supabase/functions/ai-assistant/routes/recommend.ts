import { chatWithFallback } from '../services/aiService.ts';
import { fetchUserStudyData } from '../services/userDataService.ts';
import { validateRecommendRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

/** ر.ک. توضیح مشابه در routes/analyze.ts */
function stripCodeFence(raw: string): string {
    const trimmed = raw.trim();
    const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
    return match ? match[1].trim() : trimmed;
}

export async function handleRecommend(data: unknown) {
    try {
        const { userId, goal } = validateRecommendRequest(data);
        const userData = await fetchUserStudyData(userId);
        const goalText = goal || 'improve overall study performance';

        const prompt = `
You are an AI study advisor. Based on the following student data, provide personalized recommendations to help them ${goalText}.

Data:
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

Provide 3 to 5 specific, actionable recommendations. Each recommendation should be clear and practical.
Respond with ONLY a raw JSON object (no markdown code fences, no commentary) with a key "recommendations" (array of strings) and an optional "rationale" (string) explaining the reasoning.
Keep it concise.
    `;

        const result = await chatWithFallback(
            [
                { role: 'system', content: 'You are a practical study advisor. Respond with ONLY raw JSON, never wrap it in markdown code fences.' },
                { role: 'user', content: prompt },
            ],
            { maxTokens: 600, temperature: 0.6 },
            userId
        );

        const cleaned = stripCodeFence(result.content);

        let parsed: any;
        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            logger.warn('Failed to parse recommendations JSON, wrapping raw text as a single recommendation');
            // متن خام (پس از حذف فنس) به‌عنوان یک آیتم لیست برمی‌گردد، نه به
            // شکل یک بلوک JSON؛ کلاینت هم لایه دفاعی دوم را روی آن اجرا می‌کند.
            return { success: true, data: { recommendations: [cleaned] }, provider: result.provider };
        }

        return {
            success: true,
            data: {
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                rationale: typeof parsed.rationale === 'string' ? parsed.rationale : undefined,
            },
            provider: result.provider,
        };
    } catch (error) {
        logger.error('Recommend handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}