import React from "react";
import Markdown from "react-markdown";
import { useSearchParams } from "react-router-dom";

export const Notes: React.FC = () => {
  // get the data from URL param "notes" via React Router DOM
  const [searchParams, _] = useSearchParams();
  const notes = searchParams.get("notes");
  const project = searchParams.get("project");
  return (
    <div className="flex-start flex flex-col gap-1 px-4 py-2">
      <h1 className="text-2xl font-extralight">Generated Notes for {project}</h1>
      <hr />
      <Markdown>{notes}</Markdown>
    </div>
  );
};
