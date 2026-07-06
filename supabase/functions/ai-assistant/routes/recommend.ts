import { chatWithFallback } from '../services/aiService.ts';
import { fetchUserStudyData } from '../services/userDataService.ts';
import { validateRecommendRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

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
Format the response as a JSON object with a key "recommendations" (array of strings) and an optional "rationale" (string) explaining the reasoning.
Keep it concise.
    `;

        const result = await chatWithFallback(
            [
                { role: 'system', content: 'You are a practical study advisor. Respond in JSON format.' },
                { role: 'user', content: prompt },
            ],
            { maxTokens: 600, temperature: 0.6 },
            userId
        );

        let parsed: any;
        try {
            parsed = JSON.parse(result.content);
        } catch (e) {
            logger.warn('Failed to parse recommendations JSON, using raw text');
            return { success: true, data: { recommendations: [result.content] }, provider: result.provider };
        }

        return {
            success: true,
            data: {
                recommendations: parsed.recommendations || [],
                rationale: parsed.rationale || undefined,
            },
            provider: result.provider,
        };
    } catch (error) {
        logger.error('Recommend handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}