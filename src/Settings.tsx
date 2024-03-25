import React, { useEffect } from "react";
import { getSetting, setSetting } from "./db";

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = React.useState<string | null>(null);

  useEffect(() => {
    getSetting("openai-api-key").then((r) => {
      r && setApiKey(r.value);
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
            setSetting("openai-api-key", e.target.value ?? "");
          }}
          type="text"
          className="border border-gray-300 p-2"
          placeholder="API Key - must have access to gpt-4-0125-preview"
        />
      </div>
    </div>
  );
};
