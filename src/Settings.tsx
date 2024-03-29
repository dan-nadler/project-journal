import React, { useEffect } from "react";
import { getSetting, setSetting } from "./db";
import { DEFAULT_SYSTEM_PROMPTS, SETTINGS } from "./globals";

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [projectSummarySystemPrompt, setProjectSummarySystemPrompt] =
    React.useState<string | null>(null);
  const [periodicUpdateSystemPrompt, setPeriodicUpdateSystemPrompt] =
    React.useState<string | null>(null);

  useEffect(() => {
    getSetting(SETTINGS.OAI_API_KEY).then((r) => {
      r && setApiKey(r.value);
    });

    getSetting(
      SETTINGS.PROJECT_SUMMARY_SYSTEM_PROMPT,
      DEFAULT_SYSTEM_PROMPTS.PROJECT_SUMMARY_SYSTEM_PROMPT,
    ).then((r) => {
      console.log(r);
      r && setProjectSummarySystemPrompt(r.value);
    });

    getSetting(
      SETTINGS.PERIODIC_UPDATE_SYSTEM_PROMPT,
      DEFAULT_SYSTEM_PROMPTS.PERIODIC_UPDATE_SYSTEM_PROMPT,
    ).then((r) => {
      console.log(r);
      r && setPeriodicUpdateSystemPrompt(r.value);
    });
  }, []);

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-stone-500">OpenAI API Key</label>
        <input
          value={apiKey ?? ""}
          onChange={(e) => {
            setApiKey(e.target.value);
            setSetting(SETTINGS.OAI_API_KEY, e.target.value ?? "");
          }}
          type="text"
          className="border border-gray-300 p-2"
          placeholder="API Key - must have access to gpt-4-0125-preview"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-stone-500">
          Project Summary System Prompt
        </label>
        <textarea
          value={projectSummarySystemPrompt ?? ""}
          onChange={(e) => {
            setProjectSummarySystemPrompt(e.target.value);
            setSetting(
              SETTINGS.PROJECT_SUMMARY_SYSTEM_PROMPT,
              e.target.value ?? "",
            );
          }}
          className="h-[15rem] border border-gray-300 p-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-stone-500">
          Periodic Update System Prompt
        </label>
        <textarea
          value={periodicUpdateSystemPrompt ?? ""}
          onChange={(e) => {
            setPeriodicUpdateSystemPrompt(e.target.value);
            setSetting(
              SETTINGS.PERIODIC_UPDATE_SYSTEM_PROMPT,
              e.target.value ?? "",
            );
          }}
          className="h-[15rem] border border-gray-300 p-2"
        />
      </div>
    </div>
  );
};
