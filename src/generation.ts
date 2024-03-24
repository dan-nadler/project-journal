import OpenAI from "openai";
import { IEntry } from "./db";

const openai = new OpenAI({
  apiKey: "***",
  dangerouslyAllowBrowser: true,
});

export const summarizeEntries = async (entries: IEntry[]) => {
  console.log("summarizing entries", entries);
  const content: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    entries.map((entry) => ({
      role: "user",
      content: `${entry.date}:\n${entry.content}`,
    }));
  const result = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [
      {
        role: "system",
        content: `Summarize the following entries as bulletted notes for distribution 
        as an email to interested parties. This is a professional email and should be 
        concise and professional.\n\nUse markdown to format your response.`,
      },
      ...content,
    ],
  });
  console.log(result);
  return result.choices[0].message.content;
};
