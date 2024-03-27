import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const SETTINGS = {
  OAI_API_KEY: "openai-api-key",
  PROJECT_SUMMARY_SYSTEM_PROMPT: "project-summary-system-prompt",
};

export const DEFAULT_SYSTEM_PROMPTS = {
  PROJECT_SUMMARY_SYSTEM_PROMPT:
    "Summarize the following entries as bulletted notes for distribution " +
    "as an email to interested parties. This is a professional email and should be " +
    "concise and professional.\n\nUse markdown to format your response. Your response " +
    "will converted to HTML and rendered, so use Markdown accordingly. For example, only " +
    "use code blocks for code, make appropriate use of heads, and so on.",
};

export const SETTINGS_WEBVIEW = () =>
  new WebviewWindow("settings", {
    title: "Settings",
    width: 720,
    height: 600,
    url: `/settings`,
    resizable: true,
    visible: true,
    focus: true,
  });

export const GENERATED_NOTES_WEBVIEW = (notes: string, project: string) => {
  const data = new URLSearchParams();

  data.append("project", project);
  data.append("notes", notes || "No notes were generated.");

  new WebviewWindow("generated-notes", {
    title: "Generated Notes",
    width: 600,
    height: 720,
    url: `/notes?${data.toString()}`,
    resizable: true,
    visible: true,
    focus: true,
  });
};
