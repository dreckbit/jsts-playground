use serde::Serialize;
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize};

#[derive(Serialize)]
struct WindowState {
    width: u32,
    height: u32,
    x: i32,
    y: i32,
    maximized: bool,
}

#[tauri::command]
fn get_window_state(window: tauri::Window) -> Result<WindowState, String> {
    let size = window.inner_size().map_err(|e| e.to_string())?;
    let position = window.outer_position().map_err(|e| e.to_string())?;
    let maximized = window.is_maximized().unwrap_or(false);

    Ok(WindowState {
        width: size.width,
        height: size.height,
        x: position.x,
        y: position.y,
        maximized,
    })
}

#[tauri::command]
fn set_window_state(
    window: tauri::Window,
    width: Option<u32>,
    height: Option<u32>,
    x: Option<i32>,
    y: Option<i32>,
) -> Result<(), String> {
    if let Some(w) = width {
        if let Some(h) = height {
            window
                .set_size(tauri::Size::Physical(PhysicalSize::new(w, h)))
                .map_err(|e| e.to_string())?;
        }
    }

    if let Some(new_x) = x {
        if let Some(new_y) = y {
            window
                .set_position(tauri::Position::Physical(PhysicalPosition::new(
                    new_x, new_y,
                )))
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
fn minimize_window(window: tauri::Window) {
    let _ = window.minimize();
}

#[tauri::command]
fn maximize_window(window: tauri::Window) {
    if window.is_maximized().unwrap_or(false) {
        let _ = window.unmaximize();
    } else {
        let _ = window.maximize();
    }
}

#[tauri::command]
fn close_window(window: tauri::Window) {
    let _ = window.close();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_window_state,
            set_window_state,
            minimize_window,
            maximize_window,
            close_window
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let window = app.get_webview_window("main").unwrap();
            window.set_title("JS/TS Playground").ok();

            // Emit close event so frontend can save window state
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    window_clone.emit("window-closing", ()).ok();
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
