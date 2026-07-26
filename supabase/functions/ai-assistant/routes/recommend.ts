import { chatWithFallback } from '../services/aiService.ts';
import { fetchUserStudyData } from '../services/userDataService.ts';
import { validateRecommendRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

function stripCodeFence(raw: string): string {
    const trimmed = raw.trim();
    const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
    return match ? match[1].trim() : trimmed;
}

export async function handleRecommend(data: unknown, authenticatedUserId: string) {
    try {
        const { userId, goal, complexity } = validateRecommendRequest(data);
        if (userId !== authenticatedUserId) {
            return { success: false, error: 'Unauthorized: cannot access another user\'s data' };
        }

        const userData = await fetchUserStudyData(userId);
        const goalText = goal || 'improve overall study performance';
        const model = complexity === 'simple' ? 'deepseek-chat' : 'deepseek-r1';

        const prompt = `
You are **Repolym AI Strategy Advisor** — a master coach who helps students design the perfect study roadmap.

Your task: based on this student's data, provide **5 highly personalized recommendations** to help them ${goalText}.

Student Data:
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

**Requirements:**
1. Each recommendation must be specific, actionable, and directly tied to their data.
2. Include a short rationale for each recommendation (why this will help).
3. If they have weak areas, prioritize those. If they have strong areas, suggest how to leverage them.
4. Make recommendations SMART (Specific, Measurable, Achievable, Relevant, Time-bound) where possible.
5. End with an overall strategic insight about their learning pattern.
6. **IMPORTANT for mathematical content:** Use LaTeX notation for all mathematical formulas. For inline math use \\(...\\) or $...$ . For display math use \\[...\\] or $$...$$ . This is essential for proper rendering.

Respond with ONLY a raw JSON object with:
{
  "recommendations": ["Action 1 - Rationale", "Action 2 - Rationale", ...],
  "insight": "Overall strategic insight about their learning style",
  "next_step": "The single most important thing they should do tomorrow"
}
        `;

        const result = await chatWithFallback(
            [
                { role: 'system', content: 'You are a practical, data-driven study advisor. Respond with ONLY raw JSON, never wrap it in markdown code fences.' },
                { role: 'user', content: prompt },
            ],
            { maxTokens: 700, temperature: complexity === 'advanced' ? 0.4 : 0.6, complexity, model },
            userId
        );

        const cleaned = stripCodeFence(result.content);

        let parsed: any;
        try {
            parsed = JSON.parse(cleaned);
        } catch (e) {
            logger.warn('Failed to parse recommendations JSON, returning empty list');
            return {
                success: true,
                data: {
                    recommendations: [
                        'ثبت روزانه حداقل ۳۰ دقیقه مطالعه - این کار عادت مطالعه را در شما تقویت می‌کند.',
                        'مرور آزمون‌های گذشته - نقاط ضعف خود را شناسایی کنید.',
                        'تعیین هدف هفتگی مشخص - مثلاً ۵ ساعت مطالعه در هفته.'
                    ],
                    insight: 'ثبات در مطالعه کلید موفقیت شماست.',
                    next_step: 'فردا حداقل ۳۰ دقیقه مطالعه کنید و آن را ثبت کنید.'
                },
                provider: result.provider,
            };
        }

        return {
            success: true,
            data: {
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                insight: typeof parsed.insight === 'string' ? parsed.insight : 'به مسیر خود ادامه دهید.',
                next_step: typeof parsed.next_step === 'string' ? parsed.next_step : 'فردا یک جلسه مطالعه ۳۰ دقیقه‌ای ثبت کنید.'
            },
            provider: result.provider,
        };
    } catch (error) {
        logger.error('Recommend handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}