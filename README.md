# Project Journal
## Development Tasks / TODO
### MVP
- [x] Allow the user to modify the System Prompt
- [x] Allow the user to provide examples of output style
- [x] Generate all project summaries and compile into a top-level summary
- [x] Constrain summary to a specific date range
- [x] Integrate a Gantt chart overview
- [x] Add tasks to the Gantt chart
- [ ] View a Gantt chart for a single project
- [x] Support Milestones on the Gantt chart
- [x] Sort the project list alphabetically
- [ ] Edit the Gantt chart directly
- [ ] Suport tauri update plugin via projectjournal.thetortoise.io
- [ ] Improve the LLM functionality for notes generation
### Known Issues
- [ ] The gantt chart may not populate on initial load, but does populate after an interaction.
### Future
- [ ] Support task and project dependencies in the Gantt chart
- [ ] Ingest and sync with notes on the file system (eg. Obsidian vault)
- [ ] Show summary streaming results from LLM
- [ ] Export notes as text files
- [ ] Allow the user to select the OpenAI language model

# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
