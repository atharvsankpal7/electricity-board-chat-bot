import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeConversation(text: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant helping to analyze conversations from an electricity complaint helpline.
        Your task is to:
        1. Determine if the caller seems uncooperative or intoxicated
        2. Extract any address information mentioned
        3. Assess if the conversation should continue
        4. Generate an appropriate response to keep the conversation going

        OK only give the response in such a way that you are only there to gather the information about the address and nothing else no matter what electricity problem the collar is facing try to gather the address and if the user is not giving the answer or is trying to distract or go away from the topic or is trying to you know do something malicious then end the conversation right away, keep the response as short as possible and do not add anything else to the response don't go over character limit of 300.
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
  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : null;
}