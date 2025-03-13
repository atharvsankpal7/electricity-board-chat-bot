import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeConversation(text: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant helping to analyze conversations from an electricity complaint helpline.
        Your task is to:
        1. Determine if the caller seems uncooperative or intoxicated
        2. Extract any address information mentioned
        3. Assess if the conversation should continue
        4. Generate an appropriate response to keep the conversation going
        Respond in JSON format with fields and only give the json not a single character outside the below format:
        {
          "shouldContinue": boolean,
          "address": string | null,
          "reason": string,
          "response": string
        }`
      },
      {
        role: "user",
        content: text
      }
    ]
  });
  return JSON.parse(response.choices[0].message.content);
}