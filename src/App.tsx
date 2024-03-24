import React, { useEffect } from "react";
import "./App.css";
import {
  getProjects,
  addProject,
  IProject,
  getEntries,
  IEntry,
  updateEntry,
  deleteEntry,
  deleteProject,
  addEntry,
  updateProject,
} from "./db";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { summarizeEntries } from "./generation";
import { create } from "zustand";

// Zustand store for entries
interface IEntryState {
  entries: IEntry[];
  setEntries: (entries: IEntry[]) => void;
}

const useEntries = create<IEntryState>((set) => ({
  entries: [] as IEntry[],
  setEntries: (entries: IEntry[]) => set({ entries }),
}));

// Zustand store for projects
const useProjects = create((set) => ({
  projects: [] as IProject[],
  setProjects: (projects: IProject[]) => set({ projects }),
}));

const Entry: React.FC<{ entry: IEntry; updateEntries: () => void }> = ({
  entry,
  updateEntries,
}) => {
  const [content, setContent] = React.useState(entry.content);

  useEffect(() => {
    updateEntry(entry.project_id, entry.id, content);
  }, [content]);

  return (
    <div className="w-full">
      <div className="flex flex-row gap-1">
        <div className="w-full">
          <span className="flex justify-between pb-1 text-xs font-light">
            <span className="flex gap-1">
              <span className="text-indigo-400">
                Created: {dayjs(entry.date).toDate().toLocaleString()}
              </span>
              <span>•</span>
              <span className="text-indigo-300">
                Updated: {new Date().toLocaleString()}
              </span>
            </span>
            <span
              className="w-4 cursor-pointer text-red-700"
              onClick={() => {
                deleteEntry(entry.project_id, entry.id).then(() =>
                  updateEntries(),
                );
              }}
            >
              <TrashIcon />
            </span>
          </span>
          <textarea
            placeholder="Enter your notes here..."
            className="h-[20rem] w-full flex-grow resize-y border-2 border-slate-300 bg-slate-100 bg-transparent p-1 outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

const Entries: React.FC<{ projectId: number }> = ({ projectId }) => {
  const { entries, setEntries } = useEntries((s) => s);

  const addEntryHandler = () => {
    addEntry(projectId, dayjs(), "").then(() =>
      getEntries(projectId).then(setEntries),
    );
  };

  useEffect(() => {
    getEntries(projectId).then(setEntries);
  }, [projectId]);

  const keydownHandler = (e: KeyboardEvent) => {
    if (e.key === "e" && (e.metaKey || e.ctrlKey)) addEntryHandler();
  };

  React.useEffect(() => {
    document.addEventListener("keydown", keydownHandler);
    return () => {
      document.removeEventListener("keydown", keydownHandler);
    };
  }, []);

  return (
    <>
      <div className="flex flex-col gap-1 overflow-y-auto pt-2">
        {entries
          .sort((a, b) => (a.date > b.date ? -1 : 1))
          .map((entry) => (
            <Entry
              key={entry.id}
              entry={entry}
              updateEntries={() => {
                getEntries(projectId).then(setEntries);
              }}
            />
          ))}
      </div>
      <button
        onClick={addEntryHandler}
        className="absolute bottom-0 right-0 z-10 m-4 h-8 w-8 rounded-full border-2 border-indigo-300 bg-indigo-100 opacity-70"
        title={`New Entry (${navigator.userAgent.indexOf("Mac") > -1 ? "⌘" : "Ctl"} + E)`}
      >
        <PlusIcon />
      </button>
    </>
  );
};

const ProjectTitle: React.FC<{
  project: IProject;
  updateProjectList: () => void;
  setActiveProject: (id: IProject | undefined) => void;
}> = ({ project, updateProjectList, setActiveProject }) => {
  const [name, setName] = React.useState(project.name);

  useEffect(() => {
    updateProject(project.id, name).then(() => {
      updateProjectList();
    });
  }, [name]);

  useEffect(() => {
    setName(project.name);
  }, [project]);

  return (
    <div className="flex items-center gap-1 bg-indigo-50">
      <span className="w-4">
        <PencilSquareIcon />
      </span>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-grow border-none bg-transparent p-1 text-xl outline-none"
      />
      <span
        className="w-4 cursor-pointer text-red-700"
        onClick={() => {
          deleteProject(project.id).then(() => updateProjectList());
          setActiveProject(undefined);
        }}
      >
        <TrashIcon />
      </span>
    </div>
  );
};

function App() {
  const [projects, setProjects] = React.useState<IProject[]>([]);
  const [activeProject, setActiveProject] = React.useState<
    IProject | undefined
  >(undefined);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  useEffect(() => {
    console.log(window.location.href);
    const u: Promise<UnlistenFn> = listen<string>("menu", ({ payload }) => {
      switch (payload) {
        case "new-project":
          addProject("New Project").then((r) => {
            getProjects().then((ps) => {
              setProjects(ps);
              setActiveProject(ps.find((p) => p.id === r.lastInsertId));
            });
          });
          break;
        case "generate":
          summarizeEntries(useEntries.getState().entries).then(
            (result: string | null) => {
              const data = new URLSearchParams();
              data.append("notes", result || "No notes were generated.");
              console.log(`/notes?${data.toString()}`);

              new WebviewWindow("generated-notes", {
                title: "Generated Notes",
                width: 800,
                height: 600,
                url: `/notes?${data.toString()}`,
                resizable: true,
                visible: true,
                focus: true,
              });
            },
          );
          break;
      }

      return u;
    });
  }, []);

  return (
    <div className="flex h-[100vh] w-full flex-row justify-start align-middle font-sans text-stone-800">
      <div className="flex h-[100vh] w-[10rem] flex-grow-0 flex-col gap-2 bg-zinc-800 py-2 text-stone-300">
        <div className="mx-2 flex flex-row justify-between">
          <span>Projects</span>
        </div>
        <hr />
        <ul className="flex cursor-pointer flex-col gap-2 text-sm">
          {projects.map((project) => (
            <li
              key={project.id}
              onClick={() => {
                setActiveProject(project);
              }}
              className={`${activeProject?.id === project.id && "bg-zinc-600"} px-2 hover:bg-zinc-700`}
            >
              {project.name || "Untitled Project"}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex h-[100vh] flex-grow flex-col gap-0 bg-zinc-50 p-2">
        {activeProject && (
          <>
            <ProjectTitle
              project={activeProject}
              updateProjectList={() => getProjects().then(setProjects)}
              setActiveProject={setActiveProject}
            />
            <hr className="m-0 border-slate-300 p-0" />
          </>
        )}
        <div className="flex flex-grow flex-col overflow-y-hidden">
          {activeProject && <Entries projectId={activeProject.id} />}
        </div>
      </div>
    </div>
  );
}

export default App;
