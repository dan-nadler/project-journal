import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  IProject,
  PROJECT_TYPE,
  getProjectById,
  getProjects,
  setProjectParent,
  setProjectType,
} from "./db";

export const ProjectSettings: React.FC = () => {
  const [searchParams, _] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [project, setProject] = React.useState<IProject>();
  const [projects, setProjects] = React.useState<IProject[]>([]);
  const [localProjectParent, setLocalProjectParent] = React.useState<
    number | null
  >(null);
  const [localProjectType, setLocalProjectType] =
    React.useState<PROJECT_TYPE>();

  useEffect(() => {
    getProjectById(parseInt(projectId!)).then((p) => {
      setProject(p);
      setLocalProjectParent(p.parent);
      setLocalProjectType(p.type);
    });

    getProjects().then((p) => {
      setProjects(p);
    });
  }, [projectId]);

  return (
    <div className="flex-start flex flex-col gap-2 px-4 py-2">
      <h1 className="text-2xl font-extralight">{project?.name}</h1>
      <hr className="my-2" />
      <div className="flex flex-col gap-1">
        <label className="text-stone-500">Parent</label>
        <select
          value={localProjectParent ?? undefined}
          onChange={(e) => {
            const p = e.target.value ? parseInt(e.target.value) : null;
            setLocalProjectParent(p);
            setProjectParent(project!.id, p);
          }}
        >
          <option value={undefined}>No Parent</option>
          {projects.map((p) => {
            if (p.id === project?.id || p.parent !== null) return null;
            return (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            );
          })}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-stone-500">Project Type</label>
        <select
          value={localProjectType}
          onChange={(e) => {
            const t = e.target.value as PROJECT_TYPE;
            setLocalProjectType(t);
            setProjectType(project!.id, t);
          }}
        >
          <option value={"project"}>Project</option>
          <option value={"task"}>Task</option>
          <option value={"milestone"}>Milestone</option>
        </select>
      </div>
    </div>
  );
};
