import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

app.post('/api/chat-assistant', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Missing Auth header' });
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized user' });
        }

        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "Tu es l'assistant IA de Prezta, une application de facturation et devis pour les freelances français. Tu as été conçu pour les aider à rédiger des communications pro (relances, devis, emails) et pour répondre à leurs questions. Ton ton doit être professionnel, encourageant, précis et concis."
        });

        const formattedHistory = messages.slice(0, -1).map((msg) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Gemini requires the history to start with a 'user' message. 
        // If our UI starts with a greeting from the 'assistant', we must remove it from the strict history.
        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift();
        }

        const currentMessage = messages[messages.length - 1].content;

        let promptTokens = 0;
        try {
            const promptTokensReq = await model.countTokens({
                contents: [...formattedHistory, { role: 'user', parts: [{ text: currentMessage }] }],
            });
            promptTokens = promptTokensReq.totalTokens;
        } catch (e) {
            console.warn("countTokens failed for prompt, defaulting to 0", e.message);
        }

        const chat = model.startChat({
            history: formattedHistory,
        });

        const result = await chat.sendMessageStream(currentMessage);

        // Setup SSE Headers
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        let fullResponse = "";

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            res.write(chunkText);
        }

        let completionTokens = 0;
        try {
            const completionTokensReq = await model.countTokens(fullResponse);
            completionTokens = completionTokensReq.totalTokens;
        } catch (e) {
            console.warn("countTokens failed for completion, defaulting to 0", e.message);
        }
        const totalTokens = promptTokens + completionTokens;

        // Log Usage
        supabase.from('ai_usage_logs').insert({
            user_id: user.id,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: totalTokens,
            action: 'chat'
        }).then(({ error }) => {
            if (error) console.error('Failed to log AI usage:', error);
        });

        res.end();

    } catch (error) {
        console.error('Local Proxy Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🤖 Prezta AI Local Proxy running on http://localhost:${PORT}`);
});
