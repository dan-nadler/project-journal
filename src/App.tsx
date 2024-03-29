import React, { useCallback, useEffect, useState } from "react";
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
  addStatus,
  getStatus,
  IStatus,
  updateStatus,
  deleteStatus,
  getEntriesOverRange,
} from "./db";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import {
  Bars3BottomRightIcon,
  TrashIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { listen } from "@tauri-apps/api/event";
import {
  IProjectNotes,
  generatePeriodicUpdate,
  summarizeEntries,
} from "./generation";
import { create } from "zustand";
import MDEditor from "@uiw/react-md-editor";
import { confirm } from "@tauri-apps/plugin-dialog";
import { GENERATED_NOTES_WEBVIEW, SETTINGS_WEBVIEW } from "./globals";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

dayjs.extend(utc);

// Zustand store for entries
interface IEntryState {
  entries: IEntry[];
  setEntries: (entries: IEntry[]) => void;
}

const useEntries = create<IEntryState>((set) => ({
  entries: [] as IEntry[],
  setEntries: (entries: IEntry[]) => set({ entries }),
}));

// Zustand store for status
interface IStatusState {
  status: IStatus[];
  setStatus: (status: IStatus[]) => void;
}

const useStatus = create<IStatusState>((set) => ({
  status: [] as IStatus[],
  setStatus: (status: IStatus[]) => set({ status }),
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
  const { status } = useStatus((s) => s);

  const getProjectStatus = (id: number): IStatus | null => {
    if (status === undefined) {
      return null;
    } else {
      return (
        status
          .sort((a, b) => (a.date_created > b.date_created ? -1 : 1))
          .find((s) => s.project_id === id) ?? null
      );
    }
  };

  return (
    projects.length > 0 && (
      <Gantt
        viewMode={ViewMode.Week}
        todayColor="rgba(99, 102, 241, 0.1)"
        TaskListHeader={({ headerHeight }) => (
          <div style={{ height: headerHeight }} className="bg-indi border p-2">
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
          start: dayjs(getProjectStatus(p.id)?.start_date).toDate(),
          end: dayjs(getProjectStatus(p.id)?.end_date).toDate(),
          name: p.name,
          id: p.id.toString(),
          type: "project",
          progress: getProjectStatus(p.id)?.progress ?? 0,
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
  const [lastUpdate, setLastUpdate] = React.useState(dayjs(entry.date_updated));

  return (
    <div className="w-full">
      <div className="flex flex-row gap-1">
        <div className="w-full">
          <span className="flex justify-between pb-1 text-xs font-light">
            <span className="flex gap-1">
              <span className="text-indigo-400">
                Created:{" "}
                {dayjs(entry.date_created).format("YYYY-MM-DD h:mm a")}
              </span>
              <span>•</span>
              <span className="text-indigo-300">
                {lastUpdate
                  ? `Updated: ${lastUpdate.format("YYYY-MM-DD h:mm a")}`
                  : ""}
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
                    deleteEntry(entry.project_id, entry.id).then(updateEntries);
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
                const d = dayjs();
                updateEntry(entry.project_id, entry.id, v ?? "", d);
                setLastUpdate(d);
              }}
              preview="edit"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Status: React.FC<{ status: IStatus; updateStatusState: () => void }> = ({
  status,
  updateStatusState,
}) => {
  const [progress, setProgress] = useState(status.progress);
  const [startDate, setStartDate] = useState(dayjs(status.start_date));
  const [endDate, setEndDate] = useState(dayjs(status.end_date));

  return (
    <div className="">
      <div className="flex flex-row justify-between gap-4 pb-1">
        <span className="text-xs font-light text-emerald-500">
          Created: {dayjs(status.date_created).format("YYYY-MM-DD h:mm a")}
        </span>
        <div
          className="w-4 cursor-pointer text-red-700"
          onClick={() => {
            confirm("Are you sure you want to delete this status update?", {
              title: "Delete Status Update?",
              kind: "warning",
            }).then((x) => {
              if (x) {
                deleteStatus(status.project_id, status.id).then(
                  updateStatusState,
                );
              }
            });
          }}
        >
          <TrashIcon />
        </div>
      </div>
      <div className="flex flex-row items-center justify-start gap-4 rounded-sm border border-emerald-400 bg-stone-100 p-2 text-sm">
        <div className="flex flex-row justify-start gap-2 ">
          <label className="text-right">Progress</label>
          <input
            className="w-[5rem] rounded-md px-2"
            value={progress}
            onChange={(e) => {
              setProgress(e.target.valueAsNumber);
              updateStatus(
                status.project_id,
                status.id,
                e.target.valueAsNumber,
                dayjs(status.start_date),
                dayjs(status.end_date),
              ).then(updateStatusState);
            }}
            type="number"
          />
        </div>
        <div className="flex flex-row gap-2">
          <label className="text-right">Start Date</label>
          <input
            className="w-[7rem] rounded-md px-2"
            value={startDate.utc().format("YYYY-MM-DD")}
            onChange={(e) => {
              setStartDate(
                // This is an incredibly stupid way to do this, I really need to do this properly...
                dayjs(dayjs(e.target.valueAsDate).utc().format("YYYY-MM-DD")),
              );
              updateStatus(
                status.project_id,
                status.id,
                status.progress,
                dayjs(e.target.valueAsDate?.toISOString()),
                dayjs(status.end_date),
              ).then(updateStatusState);
            }}
            type="date"
          />
        </div>
        <div className="flex flex-row gap-2">
          <label className="text-right">End Date</label>
          <input
            className="w-[7rem] rounded-md px-2"
            value={endDate.format("YYYY-MM-DD")}
            onChange={(e) => {
              setEndDate(
                // See the comment about this dumb shit above.
                dayjs(dayjs(e.target.valueAsDate).utc().format("YYYY-MM-DD")),
              );
              updateStatus(
                status.project_id,
                status.id,
                status.progress,
                dayjs(status.start_date),
                dayjs(e.target.valueAsDate?.toISOString()),
              ).then(updateStatusState);
            }}
            type="date"
          />
        </div>
      </div>
    </div>
  );
};

const Entries: React.FC<{ projectId: number }> = ({ projectId }) => {
  const { entries, setEntries } = useEntries((s) => s);
  const { status, setStatus } = useStatus((s) => s);

  const addEntryHandler = () => {
    addEntry(projectId, dayjs(), dayjs(), "").then(() =>
      getEntries(projectId).then(setEntries),
    );
  };

  const addStatusHandler = () => {
    const latestProgres =
      status
        .sort((a, b) => (a.date_created > b.date_created ? -1 : 1))
        .find((s) => s.project_id === projectId) ?? null;

    addStatus(
      projectId,
      latestProgres?.progress ?? 0,
      dayjs(latestProgres?.start_date),
      dayjs(latestProgres?.end_date),
    ).then(() => getStatus().then(setStatus));
  };

  useEffect(() => {
    getEntries(projectId).then(setEntries);
    getStatus().then(setStatus);
  }, [projectId]);

  const keydownHandler = (e: KeyboardEvent) => {
    if (e.key === "e" && (e.metaKey || e.ctrlKey)) addEntryHandler();
    if (e.key === "p" && (e.metaKey || e.ctrlKey)) addStatusHandler();
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
        {[...entries, ...status]
          .sort((a, b) => (a.date_created > b.date_created ? -1 : 1))
          .map((i) => {
            if (i.hasOwnProperty("progress")) {
              if (i.project_id == projectId) {
                const s = i as IStatus;
                return (
                  <Status
                    key={`s${s.id}`}
                    status={s}
                    updateStatusState={() => {
                      getStatus().then(setStatus);
                    }}
                  />
                );
              }
            } else {
              const e = i as IEntry;
              return (
                <Entry
                  key={`e${e.id}`}
                  entry={e}
                  updateEntries={() => {
                    getEntries(projectId).then(setEntries);
                  }}
                />
              );
            }
          })}
      </div>
      <div className="absolute bottom-0 right-0 z-10 m-4 flex h-8 flex-row gap-1">
        <button
          onClick={addEntryHandler}
          className="w-8 rounded-full border-2 border-indigo-300 bg-indigo-100 p-1 opacity-70"
          title={`New Entry (${navigator.userAgent.indexOf("Mac") > -1 ? "⌘" : "Ctl"} + E)`}
        >
          <Bars3BottomRightIcon />
        </button>
        <button
          onClick={addStatusHandler}
          className="w-8 rounded-full border-2 border-emerald-400 bg-emerald-100 p-1 opacity-70"
          title={`Progress Update (${navigator.userAgent.indexOf("Mac") > -1 ? "⌘" : "Ctl"} + P)`}
        >
          <QueueListIcon />
        </button>
      </div>
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
  const { setStatus } = useStatus((s) => s);

  useEffect(() => {
    getProjects().then(setProjects);
    getStatus().then(setStatus);
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

  const handleGenerateUpdate = useCallback(async () => {
    const startDate = dayjs().subtract(7, "days");
    const endDate = dayjs();
    const projects = useProjects.getState().projects;
    console.log("generating notes for", startDate, endDate);

    const projectNotes: IProjectNotes[] = await Promise.all(
      projects.map(async (p) => {
        const entries = await getEntriesOverRange(p.id, startDate, endDate);
        const projectSummary = await summarizeEntries(entries);
        return { project: p.name, notes: projectSummary || "No updates." };
      }),
    );

    const result = await generatePeriodicUpdate(
      `${startDate.format("YYYY-MM-DD")} - ${endDate.format("YYYY-MM-DD")}`,
      projectNotes,
    );

    console.log(result);

    GENERATED_NOTES_WEBVIEW(
      result || "No notes were generated.",
      `Update for ${startDate.format("YYYY-MM-DD")} - ${endDate.format("YYYY-MM-DD")}`,
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
        case "generate-project-notes":
          handleGenerate();
          break;
        case "generate-update":
          handleGenerateUpdate();
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
      <div className="flex h-[100vh] w-full flex-col gap-0 overflow-auto bg-zinc-100 p-2">
        {activeProject && (
          <>
            <ProjectTitle
              project={activeProject}
              updateProjectList={() => getProjects().then(setProjects)}
            />
            <hr className="m-0 border-zinc-300 p-0" />
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
