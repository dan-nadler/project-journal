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

    let m7 = Migration {
        version: 7,
        description: "dont_cascade_delete",
        sql: "create table status_dg_tmp
        (
            id           integer         not null
                constraint status_pk
                    primary key autoincrement,
            project_id   integer
                constraint status_projects_id_fk
                    references projects,
            progress     integer,
                         start_date text not null,
            end_date     text            not null,
            date_created text            not null
        );
        
        insert into status_dg_tmp(id, project_id, progress, start_date, end_date, date_created)
        select id, project_id, progress, start_date, end_date, date_created
        from status;
        
        drop table status;
        
        alter table status_dg_tmp
            rename to status;
        
        create table entries_dg_tmp
        (
            id           integer not null
                constraint entries_pk
                    primary key,
            date_created TEXT    not null,
            content      text,
            project_id   integer not null
                constraint entries_projects_id_fk
                    references projects,
            date_updated TEXT
        );
        
        insert into entries_dg_tmp(id, date_created, content, project_id, date_updated)
        select id, date_created, content, project_id, date_updated
        from entries;
        
        drop table entries;
        
        alter table entries_dg_tmp
            rename to entries;
        ",
        kind: MigrationKind::Up,
    };

    let m8 = Migration {
        version: 8,
        description: "add_project_parent",
        // https://github.com/launchbadge/sqlx/issues/2085#issuecomment-1499859906
        sql: "-- remove the original TRANSACTION
        COMMIT TRANSACTION;
        
        -- tweak config
        PRAGMA foreign_keys=OFF;
        
        -- start your own TRANSACTION
        BEGIN TRANSACTION;        
        
        create table projects_dg_tmp
        (
            id     integer not null
                constraint projects_pk
                    primary key autoincrement,
            name   text    not null,
            parent integer 
                constraint projects_projects_id_fk
                    references projects
        );
        
        insert into projects_dg_tmp(id, name)
        select id, name
        from projects;
        
        drop table projects;
        
        alter table projects_dg_tmp
            rename to projects;
            
        -- check foreign key constraint still upholding.
        PRAGMA foreign_key_check;
        
        -- commit your own TRANSACTION
        COMMIT TRANSACTION;
        
        -- rollback all config you setup before.
        PRAGMA foreign_keys=ON;
        
        -- start a new TRANSACTION to let migrator commit it.
        BEGIN TRANSACTION;",
        kind: MigrationKind::Up,
    };

    let m9 = Migration {
        version: 9,
        description: "add_project_type_column",
        sql: "alter table projects
        add type TEXT;
        
        update projects set type = 'project' where parent is null;
        
        update projects set type = 'task' where parent is not null;",
        kind: MigrationKind::Up,
    };

    return vec![migration, m2, m3, m4, m5, m6, m7, m8, m9];
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
                                "generate-project-notes",
                                "&Generate Project Notes",
                                true,
                                Some("CmdOrCtrl+G"),
                            )?,
                            &MenuItem::with_id(
                                handle,
                                "generate-update",
                                "Generate Periodic &Update",
                                true,
                                Some("CmdOrCtrl+U"),
                            )?,
                            #[cfg(target_os = "windows")]
                            &MenuItem::with_id(
                                handle,
                                "settings",
                                "&Settings",
                                true,
                                Some("CmdOrCtrl+,"),
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
