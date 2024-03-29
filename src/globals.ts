import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const SETTINGS = {
  OAI_API_KEY: "openai-api-key",
  PROJECT_SUMMARY_SYSTEM_PROMPT: "project-summary-system-prompt",
  PERIODIC_UPDATE_SYSTEM_PROMPT: "periodic-summary-system-prompt",
};

export const DEFAULT_SYSTEM_PROMPTS = {
  PROJECT_SUMMARY_SYSTEM_PROMPT:
    "Summarize the following entries as bulletted notes for distribution " +
    "as an email to interested parties. This is a professional email and should be " +
    "concise and professional.\n\nUse markdown to format your response. Your response " +
    "will converted to HTML and rendered, so use Markdown accordingly. For example, only " +
    "use code blocks for code, make appropriate use of headers, and so on. It is very important " +
    "that you be concise.",
  PERIODIC_UPDATE_SYSTEM_PROMPT:
    "You will be provided with notes for various projects that were all take over a specified period of time. " +
    "Compile the following notes into an organized bulletted list of notes. These notes will " +
    "be distributed to business leaders to keep them up-date-date on internal intiatives, so " +
    "it is important that only the most relevant notes are highlighted, and that it is concise and " +
    "to the point. Each project should have a top-level bullet with any relevant notes nested below it. " +
    "If there are no notes for a project, then simply write '- No updates.' ",
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
