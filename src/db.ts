import Database from "@tauri-apps/plugin-sql";
import { Dayjs } from "dayjs";

export interface IProject {
  id: number;
  name: string;
}

export interface IEntry {
  id: number;
  project_id: number;
  content: string;
  date: string;
}

export const getDB = async () => {
  return Database.load("sqlite:database.db");
};

export const getProjects = async () => {
  const db = await getDB();
  const result = db.select<IProject[]>("SELECT * FROM projects");
  return result;
};

export const addProject = async (name: string) => {
  const db = await getDB();
  const result = db.execute("INSERT INTO projects (name) VALUES (?)", [name]);
  return result;
};

export const updateProject = async (id: number, name: string) => {
  const db = await getDB();
  const result = db.execute("UPDATE projects SET name = ? WHERE id = ?", [
    name,
    id,
  ]);
  return result;
};

export const getEntries = async (project_id: number) => {
  const db = await getDB();
  const result = db.select<IEntry[]>(
    "SELECT * FROM entries WHERE project_id = ?",
    [project_id],
  );
  return result;
};

export const addEntry = async (
  project_id: number,
  date: Dayjs,
  content: string,
) => {
  const db = await getDB();
  const result = db.execute(
    "INSERT INTO entries (project_id, date, content) VALUES (?, ?, ?)",
    [project_id, date.toISOString(), content],
  );
  return result;
};

export const updateEntry = async (
  project_id: number,
  id: number,
  content: string,
) => {
  const db = await getDB();
  const result = db.execute(
    "UPDATE entries SET content = ? WHERE project_id = ? AND id = ?",
    [content, project_id, id],
  );
  return result;
};
