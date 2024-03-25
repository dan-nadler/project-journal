import OpenAI from "openai";
import { IEntry } from "./db";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getSetting } from "./db";

getSetting("openai-api-key").then((key) => {
  if (!key) {
    new WebviewWindow("settings", {
      title: "Settings",
      width: 720,
      height: 600,
      url: `/settings`,
      resizable: true,
      visible: true,
      focus: true,
    });
  }
});

const openai = async () => {
  const k = (await getSetting("openai-api-key"))?.value;
  if (!k) {
    throw new Error("OpenAI API Key not set");
  }
  return new OpenAI({
    apiKey: k,
    dangerouslyAllowBrowser: true,
  });
};

export const summarizeEntries = async (entries: IEntry[]) => {
  console.log("summarizing entries", entries);

  const content: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    entries.map((entry) => ({
      role: "user",
      content: `${entry.date_created}:\n${entry.content}`,
    }));
  const o = await openai();
  const result = await o.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [
      {
        role: "system",
        content: `Summarize the following entries as bulletted notes for distribution 
        as an email to interested parties. This is a professional email and should be 
        concise and professional.\n\nUse markdown to format your response. Your response 
        will converted to HTML and rendered, so use Markdown accordingly. For example, only 
        use code blocks for code, make appropriate use of heads, and so on.`,
      },
      ...content,
    ],
  });
  return result.choices[0].message.content;
};
