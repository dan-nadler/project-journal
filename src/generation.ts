import OpenAI from "openai";
import { IEntry } from "./db";
import { getSetting } from "./db";
import { DEFAULT_SYSTEM_PROMPTS, SETTINGS, SETTINGS_WEBVIEW } from "./globals";

getSetting(SETTINGS.OAI_API_KEY).then((key) => {
  if (!key) {
    SETTINGS_WEBVIEW();
  }
});

const openai = async () => {
  const k = (await getSetting(SETTINGS.OAI_API_KEY))?.value;
  if (!k) {
    throw new Error("OpenAI API Key not set");
  }
  return new OpenAI({
    apiKey: k,
    dangerouslyAllowBrowser: true,
  });
};

export const summarizeEntries = async (entries: IEntry[]) => {
  const systemPrompt = await getSetting(
    SETTINGS.PROJECT_SUMMARY_SYSTEM_PROMPT,
    DEFAULT_SYSTEM_PROMPTS.PROJECT_SUMMARY_SYSTEM_PROMPT,
  );
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
        content: systemPrompt?.value ?? "",
      },
      ...content,
    ],
  });
  return result.choices[0].message.content;
};

export interface IProjectNotes {
  project: string;
  notes: string;
}

export const generatePeriodicUpdate = async (
  dateRange: string,
  notes: IProjectNotes[],
) => {
  const systemPrompt = await getSetting(
    SETTINGS.PERIODIC_UPDATE_SYSTEM_PROMPT,
    DEFAULT_SYSTEM_PROMPTS.PERIODIC_UPDATE_SYSTEM_PROMPT,
  );

  let content = notes
    .map((i) => {
      return `## ${i.project}\n\n${i.notes}`;
    })
    .join("\n\n");

  content = `# Notes for ${dateRange}\n\n${content}`;

  let payload: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "user",
      content,
    },
  ];
  const o = await openai();
  const result = await o.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [
      {
        role: "system",
        content: systemPrompt?.value ?? "",
      },
      ...payload,
    ],
  });
  return result.choices[0].message.content;
};
