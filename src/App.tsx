import React, { useEffect } from "react";
import "./App.css";
import { appDataDir } from "@tauri-apps/api/path";
import {
  getProjects,
  addProject,
  IProject,
  getEntries,
  IEntry,
  updateEntry,
  addEntry,
} from "./db";
import dayjs from "dayjs";


appDataDir().then(console.log);

const Entry: React.FC<{ entry: IEntry }> = ({ entry }) => {
  const [content, setContent] = React.useState(entry.content);

  useEffect(() => {
    updateEntry(entry.project_id, entry.id, content);
  }, [content]);

  return (
    <div className="w-full">
      <span className="text-xs font-light text-indigo-600">
        {new Date().toISOString()}
      </span>
      <textarea
        placeholder="Enter your notes here..."
        className="w-full resize-y border-2 border-slate-300 bg-slate-100 bg-transparent p-1 outline-none h-[20rem]"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
};

const Entries: React.FC<{ projectId: number }> = ({ projectId }) => {
  const [entries, setEntries] = React.useState<IEntry[]>([]);

  useEffect(() => {
    getEntries(projectId).then(setEntries);
  }, [projectId]);

  return (
    <div className="flex flex-col gap-1 overflow-y-auto pt-2">
      <button
        onClick={() => {
          addEntry(1, dayjs(), "").then(() =>
            getEntries(projectId).then(setEntries),
          );
        }}
        className="border-2 border-indigo-300 bg-indigo-100"
      >
        New Entry
      </button>
      {entries
        .sort((a, b) => (a.date > b.date ? -1 : 1))
        .map((entry) => (
          <Entry key={entry.id} entry={entry} />
        ))}
    </div>
  );
};

function App() {
  const [projects, setProjects] = React.useState<IProject[]>([]);
  const [activeProject, setActiveProject] = React.useState<number | null>(null);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  return (
    <div className="flex h-[100vh] w-full flex-row justify-start align-middle font-sans text-stone-800">
      <div className="h-[100vh] w-[10rem] flex-grow-0 bg-zinc-800 p-2 text-stone-300">
        <ul className="flex cursor-pointer flex-col gap-2 underline">
          {projects.map((project) => (
            <li key={project.id} onClick={() => setActiveProject(project.id)}>
              {project.name}
            </li>
          ))}
          <li
            className="cursor-pointer"
            onClick={() =>
              addProject("Test Project").then(() =>
                getProjects().then(setProjects),
              )
            }
          >
            New Project
          </li>
        </ul>
      </div>
      <div className="flex h-[100vh] flex-grow flex-col gap-0 bg-zinc-50 p-2">
        <div className="text-xl">
          {projects.find((p) => p.id === activeProject)?.name}
        </div>
        <hr className="border-slate-300 p-0 m-0" />
        <div className="flex-grow overflow-y-hidden flex flex-col">
          {activeProject && <Entries projectId={activeProject} />}
        </div>
      </div>
    </div>
  );
}

export default App;
