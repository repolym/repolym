import { chatWithFallback } from '../services/aiService.ts';
import { fetchUserStudyData } from '../services/userDataService.ts';
import { validateAnalyzeRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

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

Format the response as a JSON object with keys: summary, strengths (array), weaknesses (array), recommendations (array).
Keep it concise and focused.
    `;

        const result = await chatWithFallback(
            [
                { role: 'system', content: 'You are a helpful study coach. Respond in JSON format.' },
                { role: 'user', content: prompt },
            ],
            { maxTokens: 800, temperature: 0.6 },
            userId
        );

        let parsed: any;
        try {
            parsed = JSON.parse(result.content);
        } catch (e) {
            logger.warn('Failed to parse analysis JSON, falling back to raw text');
            return { success: true, data: { summary: result.content, strengths: [], weaknesses: [], recommendations: [] }, provider: result.provider };
        }

        return {
            success: true,
            data: {
                summary: parsed.summary || '',
                strengths: parsed.strengths || [],
                weaknesses: parsed.weaknesses || [],
                recommendations: parsed.recommendations || [],
            },
            provider: result.provider,
        };
    } catch (error) {
        logger.error('Analyze handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}