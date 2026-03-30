import { Task } from "./types";
import { generateId } from "./storage";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function parseTaskWithAI(text: string, date: string): Promise<Task | null> {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey || apiKey === "placeholder") return null;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const prompt = `Parse this task text into JSON. Extract title, startTime (HH:MM), endTime (HH:MM), and priority (low/medium/high).

Rules:
- Current time is ${currentTime}, date is ${date}
- If no time mentioned, use 09:00-10:00
- If only start time, add 1 hour for end
- "muhim/важно/urgent/important" = high priority
- "oddiy/обычный/minor" = low priority
- Default priority = medium
- For times like "3 da" or "в 3", assume PM (15:00) if hour is 1-6
- "ertalab/утром/morning" = 07:00, "tushda/днём/afternoon" = 13:00, "kechqurun/вечером/evening" = 19:00
- "5 minutdan keyin/через 5 минут/in 5 minutes" = current time + 5 min
- Title should be clean, without time/priority words
- Respond ONLY with JSON, no explanation

Text: "${text}"

JSON format:
{"title":"...","startTime":"HH:MM","endTime":"HH:MM","priority":"low|medium|high"}`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      id: generateId(),
      title: parsed.title || text,
      date,
      startTime: parsed.startTime || "09:00",
      endTime: parsed.endTime || "10:00",
      completed: false,
      priority: ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : "medium",
      notified: false,
      createdAt: Date.now(),
    };
  } catch (err) {
    console.error("Groq AI parse error:", err);
    return null;
  }
}
