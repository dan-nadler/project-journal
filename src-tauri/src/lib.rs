use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn migrations() -> Vec<Migration> {
    let migration = Migration {
        version: 1,
        description: "create_initial_tables",
        sql: "create table projects
        (
            id   integer not null
                constraint projects_pk
                    primary key autoincrement,
            name text    not null
        );

        create table entries
        (
            id      integer not null
                constraint entries_pk
                    primary key,
            date    TEXT    not null,
            content text,
            project_id integer not null
                constraint entries_projects_id_fk
                    references projects
        );",
        kind: MigrationKind::Up,
    };

    return vec![migration];
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let m: Vec<Migration> = migrations();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:database.db", m)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
