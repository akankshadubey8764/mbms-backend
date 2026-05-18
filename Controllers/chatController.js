const { GoogleGenerativeAI } = require("@google/generative-ai");
const KNOWLEDGE_BASE = require("../constants/knowledgeBase");

// ─────────────────────────────────────────────────────────────────────────────
// Build TWO versions of the knowledge string:
//
//   KNOWLEDGE_FULL  — used for Gemini (high token limit, handles large prompts)
//   KNOWLEDGE_SHORT — used for Groq   (strict token limits, FAQs only)
//
// The 413 error on Groq happened because the full knowledge base is ~8000 tokens
// which exceeds the free-tier per-request limit on smaller Groq models.
// ─────────────────────────────────────────────────────────────────────────────
const buildKnowledge = () => {
    try {
        const kb = KNOWLEDGE_BASE.knowledge_base;

        // Full version for Gemini
        const fullLines = [];
        (kb.chunks || []).forEach(c => fullLines.push(`[${c.title}]\n${c.content}`));
        (kb.faqs || []).forEach(f => fullLines.push(`Q: ${f.question}\nA: ${f.answer}`));
        const full = fullLines.join("\n\n");

        // Short version for Groq — FAQs only (much smaller)
        const shortLines = (kb.faqs || []).map(f => `Q: ${f.question}\nA: ${f.answer}`);
        const short = shortLines.join("\n\n");

        return { full, short };
    } catch (e) {
        const fallback = "TPGIT Hostel: hostel fee ₹14,800, mess rate ₹300/day, 5 hostels total, contact 0416-2267762";
        return { full: fallback, short: fallback };
    }
};

const { full: KNOWLEDGE_FULL, short: KNOWLEDGE_SHORT } = buildKnowledge();

// System prompt for Gemini (full knowledge base)
const SYSTEM_PROMPT_FULL = `You are the official TPGIT Hostel Assistant chatbot.
 
KNOWLEDGE BASE:
${KNOWLEDGE_FULL}
 
GUIDELINES:
1. Be polite, professional, and concise.
2. Answer using the knowledge base above.
3. Use Markdown — bullet points, bold for key info.
4. Only suggest "Raise a Query" for personal issues needing admin action.
5. If not in knowledge base: "Please contact the Hostel Office."`;

// System prompt for Groq (FAQs only — keeps request under size limit)
const SYSTEM_PROMPT_SHORT = `You are the official TPGIT Hostel Assistant chatbot. Answer student questions about TPGIT college and hostel.
 
KEY FACTS (use these to answer):
${KNOWLEDGE_SHORT}
 
RULES:
- Be concise and helpful.
- Use Markdown formatting.
- If unsure, say: "Please contact the Hostel Office at hostel@tpgit.edu.in or 0416-2267762"`;

// ─────────────────────────────────────────────────────────────────────────────
// Groq models — updated to currently active models (May 2026)
// Check latest at: console.groq.com/docs/models
// ─────────────────────────────────────────────────────────────────────────────
const GROQ_MODELS = [
    "llama-3.1-8b-instant",   // active — use SHORT prompt to avoid 413
    "llama-3.3-70b-versatile", // active, larger context
    "llama3-70b-8192",         // active fallback
];

// ─────────────────────────────────────────────────────────────────────────────
// Gemini models — only confirmed working on free tier per logs
// ─────────────────────────────────────────────────────────────────────────────
const GEMINI_MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
];

// ─────────────────────────────────────────────────────────────────────────────
// Keyword-based offline fallback — zero API calls, always works
// ─────────────────────────────────────────────────────────────────────────────
const getOfflineFallback = (message) => {
    const m = (message || "").toLowerCase();

    if (m.includes("hi") || m.includes("hello") || m.includes("hey") || m.includes("help") || m.includes("start")) {
        return "Hello! 👋 I'm the **TPGIT Hostel Assistant**. I can help you with:\n\n- 🏠 Hostel fees and accommodation\n- 🍽️ Mess billing and menu\n- 📚 College facilities and departments\n- 🎓 Admissions and placements\n- 📞 Contact information\n\nWhat would you like to know?";
    }
    if (m.includes("hostel fee") || (m.includes("fee") && !m.includes("mess"))) {
        return "**Hostel Fee Structure:**\n- One-time admission fee (non-refundable): ₹5,250\n- Annual fee: ₹9,550\n- **Total for new admission: ₹14,800**";
    }
    if (m.includes("mess") && (m.includes("rate") || m.includes("bill") || m.includes("cost") || m.includes("amount"))) {
        return "**Mess Billing:**\nBills are at **₹300/day** based on attendance.\n- Absent ≥ 7 days → charged only for days present\n- Absent < 7 days → charged for full period\n\nCheck your bill in the **Mess Bill** section of your dashboard.";
    }
    if (m.includes("hostel") && (m.includes("boys") || m.includes("girls") || m.includes("how many") || m.includes("total"))) {
        return "**TPGIT Hostels:**\n- **Boys:** 3 hostels, 181 rooms, capacity 560 students\n- **Girls:** 2 hostels\n- **Total:** 5 hostels on campus";
    }
    if (m.includes("contact") || m.includes("phone") || m.includes("address") || m.includes("email")) {
        return "**TPGIT Contact:**\n- **Address:** Chitteri Road, Bagayam, Vellore – 632002, TN\n- **Phone:** 0416-2267762 / 0416-2907762\n- **Email:** hostel@tpgit.edu.in\n- **Website:** [tpgit.edu.in](https://tpgit.edu.in)";
    }
    if (m.includes("placement") || m.includes("package") || m.includes("job") || m.includes("salary")) {
        return "**Placements:**\n- Officer: Dr. T. Suja (Mech dept)\n- Highest: ₹6–7 LPA | Average: ₹3.5 LPA\n- Top Recruiters: Yamaha, Qspiders, Arunai Power Infra";
    }
    if (m.includes("internet") || m.includes("wifi") || m.includes("net lab")) {
        return "**Internet:** Available **4:30–6:30 PM** on working days at the NET Lab, MCA Department.";
    }
    if (m.includes("library") || m.includes("book")) {
        return "**Library:** 27,873+ volumes. Book Bank for SC/ST students. Officer: Dr. R. Sudha (EEE).";
    }
    if (m.includes("scholarship")) {
        return "**Scholarships:** Hostel scholarship, SC/ST Aadhidravidar, merit-based scholarships.\nApply at [tpgit.edu.in](https://tpgit.edu.in/index.php/hostel-scholarship/)";
    }
    if (m.includes("canteen") || m.includes("food")) {
        return "**Canteen:** Center of campus. Breakfast, lunch, snacks at economical prices.";
    }
    if (m.includes("atm") || m.includes("bank")) {
        return "**ATM:** SBI ATM at the entrance of TPGIT campus.";
    }
    if (m.includes("sport") || m.includes("gym") || m.includes("cricket") || m.includes("badminton")) {
        return "**Sports:** Indoor — Chess, Carrom, Badminton, Table Tennis.\nOutdoor — Cricket, Tennis. Gym available on campus.";
    }
    if (m.includes("admission") || m.includes("tnea") || m.includes("eligibility")) {
        return "**Admission:** B.E. via **TNEA** counseling (Anna University).\n- 10+2 with PCM, min 45–50%\n- PG: TANCET/GATE scores required";
    }
    if (m.includes("naac") || m.includes("rank") || m.includes("nirf")) {
        return "**Rankings:**\n- NAAC **'A' Grade**\n- NIRF 2023: **151st** overall\n- IIRF 2024: **108th** (Engineering)\n- Anna University: **25th**";
    }
    if (m.includes("warden") || m.includes("principal")) {
        return "**Hostel Admin:**\n- **Chief Warden:** The Principal of TPGIT\n- Deputy Warden (Boys & Girls) and Residential Tutor handle day-to-day operations.";
    }

    return "I'm currently in **limited mode**. Please contact:\n- 📞 **0416-2267762**\n- 📧 **hostel@tpgit.edu.in**\n- 🌐 [tpgit.edu.in](https://tpgit.edu.in)\n\nThe AI will be back shortly!";
};

// ─────────────────────────────────────────────────────────────────────────────
// Try Groq — uses SHORT prompt to stay under the 413 size limit
// ─────────────────────────────────────────────────────────────────────────────
const tryGroq = async (message, validHistory) => {
    if (!process.env.GROQ_API_KEY) {
        console.log("[Chat] GROQ_API_KEY not set — skipping Groq");
        return null;
    }

    // Use short prompt for Groq to avoid 413 Request Too Large
    const groqMessages = [
        { role: "system", content: SYSTEM_PROMPT_SHORT },
        ...validHistory.map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.parts[0].text
        })),
        { role: "user", content: message }
    ];

    for (const model of GROQ_MODELS) {
        try {
            console.log(`[Chat] Trying Groq model: ${model}`);
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model,
                    messages: groqMessages,
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (response.status === 413) {
                console.warn(`[Chat] Groq ${model}: request too large (413) — trying next model`);
                continue;
            }
            if (response.status === 429) {
                console.warn(`[Chat] Groq ${model}: rate limited (429) — trying next model`);
                continue;
            }
            if (!response.ok) {
                const errText = await response.text();
                // Check if model is decommissioned
                if (errText.includes("decommissioned") || errText.includes("no longer supported")) {
                    console.warn(`[Chat] Groq ${model}: decommissioned — trying next model`);
                    continue;
                }
                console.warn(`[Chat] Groq ${model} failed (${response.status}):`, errText.slice(0, 100));
                continue;
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) {
                console.log(`[Chat] ✅ Groq success — ${model}`);
                return text;
            }
        } catch (err) {
            console.warn(`[Chat] Groq ${model} error:`, err.message?.slice(0, 80));
            continue;
        }
    }
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Try Gemini — uses FULL prompt (Gemini handles large context well)
// ─────────────────────────────────────────────────────────────────────────────
const tryGemini = async (message, validHistory) => {
    const keys = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_2,
    ].filter(Boolean);

    if (keys.length === 0) return null;

    for (const apiKey of keys) {
        for (const modelName of GEMINI_MODELS) {
            try {
                console.log(`[Chat] Trying Gemini key=...${apiKey.slice(-6)} model=${modelName}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: SYSTEM_PROMPT_FULL
                });

                const chat = model.startChat({
                    history: validHistory,
                    generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
                });

                const result = await chat.sendMessage(message.trim());
                const response = await result.response;
                const text = response.text();
                console.log(`[Chat] ✅ Gemini success — model=${modelName}`);
                return text;

            } catch (err) {
                const msg = err.message || "";
                if (msg.includes("404") || msg.includes("not found") || msg.includes("not supported")) {
                    console.warn(`[Chat] Gemini ${modelName}: not available`);
                    continue;
                }
                if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
                    console.warn(`[Chat] Gemini ${modelName}: QUOTA EXCEEDED on key ...${apiKey.slice(-6)}, trying next`);
                    continue;
                }
                if (msg.includes("API_KEY_INVALID") || msg.includes("403")) {
                    console.error(`[Chat] Gemini key ...${apiKey.slice(-6)} is INVALID — skipping`);
                    break;
                }
                console.warn(`[Chat] Gemini ${modelName} unknown error:`, msg.slice(0, 80));
                continue;
            }
        }
    }
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────
class ChatController {
    async handleChat(request, reply) {
        const { message, history = [] } = request.body;

        if (!message || !message.trim()) {
            return reply.status(400).send({ response: "Please type a message." });
        }

        const validHistory = history
            .filter((h, i) => !(i === 0 && h.role === 'model'))
            .map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));

        // 1. Groq first (free, fast — uses short prompt)
        const groqResponse = await tryGroq(message, validHistory);
        if (groqResponse) return reply.send({ response: groqResponse });

        // 2. Gemini fallback (full prompt, all keys × all models)
        const geminiResponse = await tryGemini(message, validHistory);
        if (geminiResponse) return reply.send({ response: geminiResponse });

        // 3. Keyword offline fallback — always works
        console.warn("[Chat] All providers exhausted. Serving offline fallback.");
        return reply.send({ response: getOfflineFallback(message) });
    }
}

module.exports = new ChatController();