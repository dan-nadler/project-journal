import React from "react";
import Markdown from "react-markdown";
import { useSearchParams } from "react-router-dom";

export const Notes: React.FC = () => {
  // get the data from URL param "notes" via React Router DOM
  const [searchParams, _] = useSearchParams();
  const notes = searchParams.get("notes");
  return <Markdown>{notes}</Markdown>;
};
