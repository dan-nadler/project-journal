import React, { useCallback, useEffect } from "react";
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
import { listen } from "@tauri-apps/api/event";
import { summarizeEntries } from "./generation";
import { create } from "zustand";
import MDEditor from "@uiw/react-md-editor";
import { confirm } from "@tauri-apps/plugin-dialog";
import { GENERATED_NOTES_WEBVIEW, SETTINGS_WEBVIEW } from "./globals";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

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
interface IProjectState {
  projects: IProject[];
  activeProject: IProject | undefined;
  setProjects: (projects: IProject[]) => void;
  setActiveProject: (activeProject: IProject | undefined) => void;
}

const useProjects = create<IProjectState>((set) => ({
  projects: [] as IProject[],
  activeProject: undefined as IProject | undefined,
  setProjects: (projects: IProject[]) => set({ projects }),
  setActiveProject: (activeProject: IProject | undefined) =>
    set({ activeProject }),
}));

// const EXAMPLE_TASKS = [
//   {
//     start: dayjs("2024-01-01").toDate(),
//     end: dayjs("2024-01-30").toDate(),
//     name: "Project 1",
//     id: "P1",
//     type: "project",
//     progress: 15,
//   },
//   {
//     start: dayjs("2024-01-01").toDate(),
//     end: dayjs("2024-01-10").toDate(),
//     name: "Task 1",
//     id: "1",
//     type: "task",
//     progress: 50,
//     project: "P1",
//   },
//   {
//     start: dayjs("2024-01-10").toDate(),
//     end: dayjs("2024-01-20").toDate(),
//     name: "Task 2",
//     id: "2",
//     type: "task",
//     progress: 0,
//     project: "P1",
//     dependencies: ["1"],
//   },
//   {
//     start: dayjs("2024-01-30").toDate(),
//     end: dayjs("2024-03-30").toDate(),
//     name: "Project 2",
//     id: "P2",
//     type: "project",
//     progress: 15,
//     dependencies: ["P1"],
//   },
//   {
//     start: dayjs("2024-01-30").toDate(),
//     end: dayjs("2024-02-10").toDate(),
//     name: "Task 1",
//     id: "2-1",
//     type: "task",
//     progress: 50,
//     project: "P2",
//     dependencies: [],
//   },
//   {
//     start: dayjs("2024-02-10").toDate(),
//     end: dayjs("2024-02-20").toDate(),
//     name: "Task 2",
//     id: "2-2",
//     type: "task",
//     progress: 0,
//     project: "P2",
//     dependencies: ["2-1"],
//   },
// ];

// Main UI components
const GanttChart: React.FC = () => {
  const { projects } = useProjects((s) => s);

  return (
    projects.length > 0 && (
        <Gantt
          viewMode={ViewMode.Week}
          TaskListHeader={({ headerHeight }) => (
            <div style={{ height: headerHeight }} className="border p-2">
              <div>Name</div>
            </div>
          )}
          TaskListTable={({ tasks, rowHeight }) => (
            <div className="border border-t-0">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  style={{ height: rowHeight }}
                  className={`flex flex-col justify-center border p-2 pr-4 ${task.type == "project" ? "" : "pl-6 font-light"}`}
                >
                  <div>{task.name}</div>
                </div>
              ))}
            </div>
          )}
          tasks={projects.map((p) => ({
            start: dayjs("2024-01-01").toDate(),
            end: dayjs("2024-03-31").toDate(),
            name: p.name,
            id: p.id.toString(),
            type: "project",
            progress: 0,
          }))}
        />
    )
  );
};

const Entry: React.FC<{ entry: IEntry; updateEntries: () => void }> = ({
  entry,
  updateEntries,
}) => {
  const [content, setContent] = React.useState(entry.content);

  return (
    <div className="w-full">
      <div className="flex flex-row gap-1">
        <div className="w-full">
          <span className="flex justify-between pb-1 text-xs font-light">
            <span className="flex gap-1">
              <span className="text-indigo-400">
                Created: {dayjs(entry.date_created).toDate().toLocaleString()}
              </span>
              <span>•</span>
              <span className="text-indigo-300">
                Updated: {dayjs(entry.date_created).toDate().toLocaleString()}
              </span>
            </span>
            <span
              className="w-4 cursor-pointer text-red-700"
              onClick={() => {
                confirm("Are you sure you want to delete this entry?", {
                  title: "Delete Entry?",
                  kind: "warning",
                }).then((x) => {
                  if (x) {
                    deleteEntry(entry.project_id, entry.id).then(() =>
                      updateEntries(),
                    );
                  }
                });
              }}
            >
              <TrashIcon />
            </span>
          </span>
          <div>
            <MDEditor
              value={content}
              onChange={(v) => {
                setContent(v ?? "");
                updateEntry(entry.project_id, entry.id, v ?? "", dayjs());
              }}
              preview="edit"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Entries: React.FC<{ projectId: number }> = ({ projectId }) => {
  const { entries, setEntries } = useEntries((s) => s);

  const addEntryHandler = () => {
    addEntry(projectId, dayjs(), dayjs(), "").then(() =>
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
    console.log(`bound listener ${projectId}`);
    document.addEventListener("keydown", keydownHandler);
    return () => {
      console.log(`unbound listener ${projectId}`);
      document.removeEventListener("keydown", keydownHandler);
    };
  }, [projectId]);

  return (
    <>
      <div className="flex flex-col gap-1 overflow-y-auto pt-2">
        {entries
          .sort((a, b) => (a.date_created > b.date_created ? -1 : 1))
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
}> = ({ project, updateProjectList }) => {
  const { setActiveProject } = useProjects((s) => s);
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
          confirm("Are you sure you want to delete this project?", {
            title: "Delete Project?",
            kind: "warning",
          }).then((x) => {
            if (x) {
              deleteProject(project.id).then(() => updateProjectList());
              setActiveProject(undefined);
            }
          });
        }}
      >
        <TrashIcon />
      </span>
    </div>
  );
};

function App() {
  const { projects, setProjects, activeProject, setActiveProject } =
    useProjects((s) => s);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleSettings = useCallback(() => {
    SETTINGS_WEBVIEW();
  }, []);

  const handleGenerate = useCallback(() => {
    summarizeEntries(useEntries.getState().entries).then(
      (result: string | null) => {
        const project =
          useProjects.getState().activeProject?.name || "Untitled Project";
        GENERATED_NOTES_WEBVIEW(result || "No notes were generated.", project);
      },
    );
  }, []);

  useEffect(() => {
    console.log(window.location.href);
    listen<string>("menu", ({ payload }) => {
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
          handleGenerate();
          break;
        case "settings":
          handleSettings();
          break;
      }
    });
  }, []);

  return (
    <div className="flex h-[100vh] w-full flex-row justify-start align-middle font-sans text-stone-800">
      <div className="flex h-[100vh] w-[15rem] flex-grow-0 flex-col gap-2 bg-zinc-800 py-2 text-stone-300">
        <div className="mx-2 flex flex-row justify-between">
          <span>Projects</span>
        </div>
        <hr />
        <ul className="flex cursor-pointer flex-col gap-2 text-sm">
          <li
            key={"gantt"}
            onClick={() => {
              setActiveProject(undefined);
            }}
            className={`${activeProject === undefined && "bg-zinc-600"} px-2 hover:bg-zinc-700`}
          >
            Gantt Chart
          </li>
          <hr />
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
      <div className="flex h-[100vh] w-full flex-col gap-0 bg-zinc-100 p-2 overflow-auto">
        {activeProject && (
          <>
            <ProjectTitle
              project={activeProject}
              updateProjectList={() => getProjects().then(setProjects)}
            />
            <hr className="m-0 border-slate-300 p-0" />
          </>
        )}
        <div className="flex flex-grow flex-col overflow-y-hidden">
          {activeProject ? (
            <Entries projectId={activeProject.id} />
          ) : (
            <div className={`h-[100vh]`}>
              <GanttChart />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
