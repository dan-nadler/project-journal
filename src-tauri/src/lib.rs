use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::Manager;
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
                    on delete cascade
        );",
        kind: MigrationKind::Up,
    };

    let m2 = Migration {
        version: 2,
        description: "add_date_updated",
        sql: "alter table entries
        add date_updated TEXT;",
        kind: MigrationKind::Up,
    };

    let m3 = Migration {
        version: 3,
        description: "rename_date_created",
        sql: "create table entries_dg_tmp
        (
            id           integer not null
                constraint entries_pk
                    primary key,
            date_created TEXT    not null,
            content      text,
            project_id   integer not null
                constraint entries_projects_id_fk
                    references projects
                    on delete cascade,
            date_updated TEXT
        );
        
        insert into entries_dg_tmp(id, date_created, content, project_id, date_updated)
        select id, date, content, project_id, date_updated
        from entries;
        
        drop table entries;
        
        alter table entries_dg_tmp
            rename to entries;",
        kind: MigrationKind::Up,
    };

    let m4 = Migration {
        version: 4,
        description: "add_settings_table",
        sql: "create table settings
        (
            key   text not null
                constraint settings_pk
                    primary key,
            value text
        );
        
        create index settings_key_index
            on settings (key);
        
        ",
        kind: MigrationKind::Up,
    };

    let m5 = Migration {
        version: 5,
        description: "add_status_table",
        sql: "create table status
        (
            id         integer not null
                constraint status_pk
                    primary key autoincrement,
            project    integer
                constraint status_projects_id_fk
                    references projects
                    on delete cascade,
            progress   integer,
            start_date text    not null,
            end_date   text    not null
        );",
        kind: MigrationKind::Up,
    };

    let m6 = Migration {
        version: 6,
        description: "update_status_table",
        sql: "create table status_dg_tmp
        (
            id           integer not null
                constraint status_pk
                    primary key autoincrement,
            project_id   integer
                constraint status_projects_id_fk
                    references projects
                    on delete cascade,
            progress     integer,
            start_date   text    not null,
            end_date     text    not null,
            date_created text    not null
        );
        
        insert into status_dg_tmp(id, project_id, progress, start_date, end_date)
        select id, project, progress, start_date, end_date
        from status;
        
        drop table status;
        
        alter table status_dg_tmp
            rename to status;
        
        ",
        kind: MigrationKind::Up,
    };

    return vec![migration, m2, m3, m4, m5, m6];
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let m: Vec<Migration> = migrations();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:database.db", m)
                .build(),
        )
        .setup(|app| {
            app.on_menu_event(|app_handle: &tauri::AppHandle, event| {
                println!("menu event: {:?}", event);
                app_handle.emit("menu", event.id).expect("failed to emit");
            });
            Ok(())
        })
        .menu(|handle| {
            Menu::with_items(
                handle,
                &[
                    &PredefinedMenuItem::separator(handle)?,
                    #[cfg(target_os = "macos")]
                    &Submenu::with_items(
                        handle,
                        "Project Journal",
                        true,
                        &[
                            #[cfg(target_os = "macos")]
                            &MenuItem::with_id(
                                handle,
                                "settings",
                                "&Settings",
                                true,
                                Some("CmdOrCtrl+,"),
                            )?,
                            &PredefinedMenuItem::separator(handle)?,
                            &PredefinedMenuItem::quit(handle, None)?,
                        ],
                    )?,
                    &Submenu::with_items(
                        handle,
                        "File",
                        true,
                        &[
                            &MenuItem::with_id(
                                handle,
                                "new-project",
                                "&New Project",
                                true,
                                Some("CmdOrCtrl+N"),
                            )?,
                            &MenuItem::with_id(
                                handle,
                                "generate",
                                "&Generate...",
                                true,
                                Some("CmdOrCtrl+G"),
                            )?,
                            &PredefinedMenuItem::separator(handle)?,
                            &PredefinedMenuItem::close_window(handle, None)?,
                            #[cfg(target_os = "windows")]
                            &PredefinedMenuItem::quit(handle, None)?,
                        ],
                    )?,
                ],
            )
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
