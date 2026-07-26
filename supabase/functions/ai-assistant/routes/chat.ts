import { chatWithFallback } from '../services/aiService.ts';
import { validateChatRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

function detectRequestedLanguage(messages: Array<{ role: string; content: string }>): string | null {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return null;
    const text = lastUserMessage.content;
    const patterns = [
        { lang: 'english', regex: /\b(answer|respond|speak|write|reply|translate)\s+(in\s+)?(english|en)\b/i },
        { lang: 'german', regex: /\b(answer|respond|speak|write|reply|translate)\s+(in\s+)?(german|de|deutsch)\b/i },
    ];
    for (const p of patterns) {
        if (p.regex.test(text)) {
            return p.lang;
        }
    }
    return null;
}

function getSmartSystemPrompt(language: string): string {
    const base = `
You are **Repolym AI Mentor** — a world-class educational coach, study strategist, and motivational guide for Olympiad students.

Your mission is to help students achieve peak performance by providing:
- Deep, accurate answers to academic questions (math, physics, biology, etc.)
- Smart study strategies based on their learning patterns
- Personalized encouragement that keeps them motivated
- Actionable advice to turn weaknesses into strengths

Your communication style:
- Professional yet warm — like a top-tier private tutor who genuinely cares
- Use clear, structured explanations with examples
- Always highlight the "why" behind concepts, not just the "how"
- End every response with a short motivational push or a "next step" question

**CRITICAL RULES:**
1. If the user asks a purely academic question (e.g., "what is a derivative?"), give a concise but thorough explanation with a real-world example.
2. If the user asks about study strategies, time management, or exam prep, provide science-backed, practical advice tailored to their level.
3. If the user seems stuck or overwhelmed, reframe their challenge positively and offer a small, doable action.
4. Never say "I don't know" — instead say "Let me think about that..." and give your best reasoning, then invite clarification.
5. ALWAYS respond in Persian unless the user explicitly requests another language.
6. **IMPORTANT for mathematical content:** Use LaTeX notation for all mathematical formulas. For inline math use \\(...\\) or $...$ . For display math (equations on their own line) use \\[...\\] or $$...$$ . For example: "تابع $f(x) = x^2$ را در نظر بگیرید." or "مشتق به صورت $$\\frac{d}{dx} x^2 = 2x$$ است." This is essential for proper rendering.`;

    if (language === 'english') {
        return base + '\n7. Respond in English at all times.';
    } else if (language === 'german') {
        return base + '\n7. Respond in German at all times.';
    } else {
        return base + '\n7. Respond in Persian. Use formal, respectful Persian with a touch of warmth.';
    }
}

export async function handleChat(data: unknown) {
    try {
        const { messages, userId, complexity } = validateChatRequest(data);
        const requestedLang = detectRequestedLanguage(messages);
        const systemPrompt = getSmartSystemPrompt(requestedLang || 'persian');

        const model = complexity === 'advanced' ? 'deepseek-r1' : 'deepseek-chat';

        let finalMessages = messages;
        const systemIndex = messages.findIndex(m => m.role === 'system');
        if (systemIndex !== -1) {
            finalMessages = [...messages];
            finalMessages[systemIndex] = { role: 'system', content: systemPrompt };
        } else {
            finalMessages = [{ role: 'system', content: systemPrompt }, ...messages];
        }

        const result = await chatWithFallback(finalMessages, {
            maxTokens: 1024,
            temperature: complexity === 'advanced' ? 0.5 : 0.7,
            complexity,
            model,
        }, userId);

        return { success: true, data: { message: result.content, usage: result.usage }, provider: result.provider };
    } catch (error) {
        logger.error('Chat handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}