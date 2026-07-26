import { chatWithFallback } from '../services/aiService.ts';
import { fetchUserStudyData } from '../services/userDataService.ts';
import { validateAnalyzeRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

function stripCodeFence(raw: string): string {
    const trimmed = raw.trim();
    const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
    return match ? match[1].trim() : trimmed;
}

export async function handleAnalyze(data: unknown, authenticatedUserId: string) {
    try {
        const { userId, period, complexity } = validateAnalyzeRequest(data);
        if (userId !== authenticatedUserId) {
            return { success: false, error: 'Unauthorized: cannot access another user\'s data' };
        }

        const userData = await fetchUserStudyData(userId);

        // Use advanced model for analysis by default, or complexity-based
        const model = complexity === 'simple' ? 'deepseek-chat' : 'deepseek-r1';

        const prompt = `
You are **Repolym AI Performance Analyst** — an expert educational data scientist and coach.

Analyze this student's study data and provide a **detailed, actionable, and motivational** performance review.

Student Data (last ${period}):
- Total sessions: ${userData.totalSessions}
- Total minutes: ${userData.totalMinutes}
- Average daily minutes: ${userData.averageDailyMinutes}
- Active days: ${userData.daysActive}
- Current streak: ${userData.currentStreak} days
- Longest streak: ${userData.longestStreak} days
- Top subjects: ${userData.topSubjects.map(s => `${s.name} (${s.minutes} min)`).join(', ')}
- Average test score: ${userData.averageTestScore}%
- Recent tests: ${userData.recentTestScores.map(t => `${t.name}: ${t.score}/${t.maxScore}`).join(', ')}
- Goals progress: ${userData.goalProgress.map(g => `${g.title} (${g.progress}%)`).join(', ')}

Provide a **structured** analysis with these 5 sections:

1. **خلاصه عملکرد** (1-2 sentences summarizing overall performance, using a powerful metaphor if possible)
2. **نقاط قوت** (3 specific strengths with brief reasoning)
3. **فرصت‌های رشد** (3 areas where they can improve, with specific examples from their data)
4. **توصیه‌های هوشمند** (3 concrete, actionable steps they can take immediately — these MUST be personalized based on their data, not generic)
5. **پیام انگیزشی** (1 short paragraph of encouragement tailored to their current level)

**CRITICAL RULES:**
- Be honest but encouraging. If they're struggling, acknowledge it gently and offer hope.
- Base every recommendation on their actual data — never make generic suggestions.
- Use their subject names and specific numbers to show you know their profile.
- The motivational message must feel personal, not like a template.

Respond with ONLY a raw JSON object with keys: summary, strengths (array), weaknesses (array), recommendations (array), motivation (string).
        `;

        const result = await chatWithFallback(
            [
                { role: 'system', content: 'You are a world-class educational data analyst. Respond with ONLY raw JSON, never wrap it in markdown code fences.' },
                { role: 'user', content: prompt },
            ],
            { maxTokens: 900, temperature: complexity === 'advanced' ? 0.4 : 0.6, complexity, model },
            userId
        );

        const cleaned = stripCodeFence(result.content);

        let parsed: any;
        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            logger.warn('Failed to parse analysis JSON, returning empty structure');
            return {
                success: true,
                data: {
                    summary: 'تحلیل انجام نشد. لطفاً دوباره تلاش کنید.',
                    strengths: [],
                    weaknesses: [],
                    recommendations: ['ثبت جلسات مطالعه منظم', 'بررسی آزمون‌های گذشته', 'تعیین هدف روزانه'],
                    motivation: 'هر روز یک قدم به جلو بردارید. موفقیت در المپیاد حاصل تداوم است! 💪'
                },
                provider: result.provider,
            };
        }

        return {
            success: true,
            data: {
                summary: parsed.summary || 'تحلیل شما آماده است.',
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                motivation: parsed.motivation || 'به راه خود ادامه دهید. هر روز بهتر از دیروز! 🚀'
            },
            provider: result.provider,
        };
    } catch (error) {
        logger.error('Analyze handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}