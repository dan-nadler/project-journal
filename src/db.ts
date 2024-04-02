import Database from "@tauri-apps/plugin-sql";
import dayjs, { Dayjs } from "dayjs";

export type PROJECT_TYPE = "project" | "task" | "milestone"

export interface IProject {
  id: number;
  name: string;
  parent: number | null;
  type: PROJECT_TYPE
}

export interface IEntry {
  id: number;
  project_id: number;
  content: string;
  date_created: string;
  date_updated: string | null;
}

export interface ISettings {
  key: string;
  value: string;
}

export interface IStatus {
  id: number;
  project_id: number;
  progress: number;
  start_date: string;
  end_date: string;
  date_created: string;
  type: string;
}

export const getDB = async () => {
  return Database.load("sqlite:database.db");
};

export const getProjects = async () => {
  const db = await getDB();
  const q = `
    select *
    from projects
    order by coalesce(parent, id), parent
  `;
  const result = await db.select<IProject[]>(q);
  return result;
};

export const getProjectById = async (id: number) => {
  const db = await getDB();
  const result = await db.select<IProject[]>(
    "SELECT * FROM projects WHERE id = ?",
    [id],
  );
  return result[0];
}

export const addProject = async (name: string) => {
  const db = await getDB();
  const result = await db.execute("INSERT INTO projects (name) VALUES (?)", [
    name,
  ]);
  return result;
};

export const updateProject = async (id: number, name: string) => {
  const db = await getDB();
  const result = await db.execute("UPDATE projects SET name = ? WHERE id = ?", [
    name,
    id,
  ]);
  return result;
};

export const deleteProject = async (id: number) => {
  const db = await getDB();
  const result = await db.execute("DELETE FROM projects WHERE id = ?", [id]);
  return result;
};

export const setProjectParent = async (id: number, parent: number | null) => {
  const db = await getDB();
  const result = await db.execute(
    "UPDATE projects SET parent = ? WHERE id = ?",
    [parent, id],
  );
  return result;
};

export const setProjectType = async (id: number, type: PROJECT_TYPE) => {
  const db = await getDB();
  const result = await db.execute(
    "UPDATE projects SET type = ? WHERE id = ?",
    [type, id],
  );
  return result;
};


export const getEntries = async (project_id: number) => {
  const db = await getDB();
  const result = await db.select<IEntry[]>(
    "SELECT * FROM entries WHERE project_id = ?",
    [project_id],
  );
  return result;
};

export const getEntriesOverRange = async (
  project_id: number,
  start_date: Dayjs,
  end_date: Dayjs,
) => {
  const db = await getDB();
  const result = await db.select<IEntry[]>(
    "select * FROM entries WHERE date_created between ? and ? and project_id = ?;",
    [start_date.toISOString(), end_date.toISOString(), project_id],
  );

  return result;
};

export const addEntry = async (
  project_id: number,
  date_created: Dayjs,
  date_updated: Dayjs,
  content: string,
) => {
  const db = await getDB();
  const result = await db.execute(
    "INSERT INTO entries (project_id, date_created, date_updated, content) VALUES (?, ?, ?, ?)",
    [
      project_id,
      date_created.toISOString(),
      date_updated.toISOString(),
      content,
    ],
  );
  return result;
};

export const updateEntry = async (
  project_id: number,
  id: number,
  content: string,
  date_updated: Dayjs,
) => {
  const db = await getDB();
  const result = await db.execute(
    "UPDATE entries SET content = ?, date_updated = ? WHERE project_id = ? AND id = ?",
    [content, date_updated.toISOString(), project_id, id],
  );
  return result;
};

export const deleteEntry = async (project_id: number, id: number) => {
  const db = await getDB();
  const result = await db.execute(
    "DELETE FROM entries WHERE project_id = ? AND id = ?",
    [project_id, id],
  );
  return result;
};

export const getSetting = async (key: string, defaultValue?: string) => {
  const db = await getDB();
  const result = await db.select<ISettings[]>(
    "SELECT * FROM settings WHERE key = ?",
    [key],
  );
  if (result.length === 0 || !result[0].value) {
    return defaultValue ? { value: defaultValue } : null;
  }
  return result[0];
};

export const setSetting = async (key: string, value: string) => {
  const db = await getDB();
  const result = await db.execute(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value],
  );
  return result;
};

export const addStatus = async (
  project_id: number,
  progress: number,
  start_date: Dayjs,
  end_date: Dayjs,
) => {
  const db = await getDB();
  const result = await db.execute(
    "INSERT INTO status (project_id, progress, start_date, end_date, date_created) VALUES (?, ?, ?, ?, ?)",
    [
      project_id,
      progress,
      start_date.utc().format("YYYY-MM-DD"),
      end_date.utc().format("YYYY-MM-DD"),
      dayjs().toISOString(),
    ],
  );
  return result;
};

export const updateStatus = async (
  project_id: number,
  id: number,
  progress: number,
  start_date: Dayjs,
  end_date: Dayjs,
) => {
  const db = await getDB();
  const result = await db.execute(
    "UPDATE status SET progress = ?, start_date = ?, end_date = ? WHERE project_id = ? AND id = ?",
    [
      progress,
      start_date.utc().format("YYYY-MM-DD"),
      end_date.utc().format("YYYY-MM-DD"),
      project_id,
      id,
    ],
  );
  return result;
};

export const getStatus = async (project_id?: number) => {
  const db = await getDB();
  if (project_id) {
    const result = await db.select<IStatus[]>(
      "SELECT * FROM status WHERE project_id = ?",
      [project_id],
    );
    return result;
  } else {
    const result = await db.select<IStatus[]>("SELECT * FROM status");
    return result;
  }
};

export const deleteStatus = async (project_id: number, id: number) => {
  const db = await getDB();
  const result = await db.execute(
    "DELETE FROM status WHERE project_id = ? AND id = ?",
    [project_id, id],
  );
  return result;
};
