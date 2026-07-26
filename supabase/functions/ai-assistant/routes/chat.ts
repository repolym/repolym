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
    const mathRules = `
MATHEMATICAL FORMATTING RULES — STRICT:

You MUST use Markdown-compatible LaTeX for every mathematical expression.

INLINE MATHEMATICS:
Use single dollar signs.

Correct:
$f(x,y)=x^2+y^2$

Correct:
$\\nabla f(x,y)=(2x,2y)$

Correct:
$\\frac{\\partial f}{\\partial x}=2x$

DISPLAY MATHEMATICS:
Use double dollar signs.

Correct:

$$
\\nabla f =
\\left(
\\frac{\\partial f}{\\partial x_1},
\\frac{\\partial f}{\\partial x_2},
\\dots,
\\frac{\\partial f}{\\partial x_n}
\\right)
$$

NEVER use square brackets as mathematical delimiters.

WRONG:
[
\\nabla f = ...
]

CORRECT:
$$
\\nabla f = ...
$$

NEVER use parentheses as mathematical delimiters.

WRONG:
( f(x,y) = x^2 + y^2 )

CORRECT:
$f(x,y)=x^2+y^2$

NEVER write raw LaTeX outside math delimiters.

WRONG:
\\nabla f = (2x,2y)

CORRECT:
$\\nabla f=(2x,2y)$

WRONG:
\\frac{a}{b}

CORRECT:
$\\frac{a}{b}$

IMPORTANT:
Parentheses that are part of a mathematical expression are allowed INSIDE math delimiters.

Example:
$\\nabla f=(2x,2y)$

The symbols (, ), [, ], =, ^, _, \\frac, \\partial, \\nabla, etc. must be inside $...$ or $$...$$ whenever they represent mathematics.

Never use:
[ ... ]
as a substitute for:
$$ ... $$

Never use:
( ... )
as a substitute for:
$ ... $

Before finalizing your answer, check every mathematical expression and ensure it is enclosed by $...$ or $$...$$.
`;

    const base = `
You are **Repolym AI Mentor** — a world-class educational coach, study strategist, and motivational guide for Olympiad students.

Your mission is to help students achieve peak performance by providing:
- Deep, accurate answers to academic questions
- Smart study strategies
- Personalized encouragement
- Actionable advice

Your communication style:
- Professional yet warm
- Clear and structured
- Explain both the "why" and the "how"
- Use examples when helpful

CRITICAL RULES:

1. Answer academic questions accurately and clearly.

2. Give structured explanations with headings and lists when useful.

3. Always respond in Persian unless another language is explicitly requested.

4. Do not expose internal reasoning or chain-of-thought.

${mathRules}
`;

    if (language === 'english') {
        return base + '\n5. Respond in English at all times.';
    }
    if (language === 'german') {
        return base + '\n5. Respond in German at all times.';
    }
    return base + '\n5. Respond in Persian. Use formal, respectful Persian with a touch of warmth.';
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