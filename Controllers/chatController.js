const { GoogleGenerativeAI } = require("@google/generative-ai");
const KNOWLEDGE_BASE = require("../constants/knowledgeBase");

class ChatController {
    async handleChat(request, reply) {
        const { message, history } = request.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return reply.send({ 
                response: "I'm currently in 'Offline Mode' because the Gemini API Key is missing. However, I can tell you that I am the TPGIT Assistant! Please ask your Admin to configure the API key." 
            });
        }

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const systemPrompt = `
                You are the TPGIT Hostel Assistant. Your goal is to help students with information about the college and the Mess Management Portal.
                
                KNOWLEDGE BASE:
                ${JSON.stringify(KNOWLEDGE_BASE, null, 2)}

                GUIDELINES:
                1. Be polite, professional, and helpful.
                2. If a student asks a "silly" or general question (e.g., "What is the mess rate?"), answer it directly using the knowledge base.
                3. DO NOT encourage them to 'Raise a Query' for things you can answer here.
                4. Only tell them to 'Raise a Query' in the portal if they have a specific, physical, or individual issue (like a broken fan, leaking tap, or payment error) that requires Admin intervention.
                5. Keep responses concise and formatted with bullet points if needed.
                6. If you don't know the answer, ask them to contact the Hostel Office.
            `;

            const chat = model.startChat({
                history: [
                    { role: "user", parts: [{ text: "Identify yourself and your purpose." }] },
                    { role: "model", parts: [{ text: "I am the TPGIT Hostel Assistant. I can help you with college info, hostel rules, and portal usage." }] },
                    ...history.map(h => ({
                        role: h.role === 'user' ? 'user' : 'model',
                        parts: [{ text: h.content }]
                    }))
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                },
            });

            const result = await chat.sendMessage(message + "\n\n(Context: " + systemPrompt + ")");
            const response = await result.response;
            const text = response.text();

            return reply.send({ response: text });
        } catch (error) {
            console.error("Gemini API Error:", error);
            return reply.status(500).send({ response: "Sorry, I'm having trouble thinking right now. Please try again later." });
        }
    }
}

module.exports = new ChatController();
