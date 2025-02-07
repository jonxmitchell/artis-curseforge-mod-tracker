use crate::database::{get_database_path, get_minimize_to_tray};
use rusqlite::Connection;
use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem, WindowEvent,
};

pub fn create_tray() -> SystemTray {
    let show = CustomMenuItem::new("show".to_string(), "Show Window");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu)
}

pub fn handle_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            let window = app.get_window("main").unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "show" => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
                // Update menu item
                app.tray_handle().get_item(&id).set_title("Hide").unwrap();
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        },
        _ => {}
    }
}

pub fn handle_window_event(app: &AppHandle, event: WindowEvent) {
    match event {
        WindowEvent::Resized(position) => {
            // Check if window is minimized
            if position.width == 0 && position.height == 0 {
                let db_path = get_database_path(app);
                let conn = Connection::open(&db_path).unwrap();

                if let Ok(minimize_to_tray) = get_minimize_to_tray(&conn) {
                    if minimize_to_tray {
                        let window = app.get_window("main").unwrap();
                        window.hide().unwrap();
                    }
                }
            }
        }
        _ => {}
    }
}
