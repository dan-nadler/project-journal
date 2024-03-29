import React from "react";
import Markdown from "react-markdown";
import { useSearchParams } from "react-router-dom";

export const Notes: React.FC = () => {
  console.log("load");
  // get the data from URL param "notes" via React Router DOM
  const [searchParams, _] = useSearchParams();
  console.log(searchParams);
  const notes = searchParams.get("notes");
  const project = searchParams.get("project");
  console.log(notes, project);
  return (
    <div className="flex-start flex flex-col gap-1 px-4 py-2">
      <h1 className="text-2xl font-extralight">
        Generated Notes for {project}
      </h1>
      <hr className="my-2"/>
      <Markdown
        components={{
          h1: ({ node, ...props }) => {
            return <h1 className="text-xl font-light" {...props} />;
          },
          h2: ({ node, ...props }) => {
            return <h2 className="text-xl font-extralight" {...props} />;
          },
          h3: ({ node, ...props }) => {
            return <h3 className="text-lg font-extralight" {...props} />;
          },
          p: ({ node, ...props }) => {
            return <p className="text-base" {...props} />;
          },
          ol: ({ node, ...props }) => {
            return <ol className="list-inside list-decimal pl-4" {...props} />;
          },
          ul: ({ node, ...props }) => {
            return <ul className="markdown-list list-inside list-disc pl-4" {...props} />;
          },
          hr: ({ node, ...props }) => {
            return <hr className="my-2" {...props} />;
          }
        }}
      >
        {notes}
      </Markdown>
    </div>
  );
};
