use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

#[tauri::command]
async fn fetch_upcoming_events() -> Result<serde_json::Value, String> {
    use base64::Engine as _;

    let client = reqwest::Client::builder()
        .use_rustls_tls()
        .build()
        .map_err(|e| e.to_string())?;

    let mut events: Vec<serde_json::Value> = client
        .get("https://othersidecalendar.apechain.com/api/v1/events/upcoming?limit=10")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    let image_futures: Vec<_> = events
        .iter()
        .map(|e| {
            let path = e.get("imageUrl").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let client = client.clone();
            async move {
                if path.is_empty() { return None; }
                let url = format!("https://othersidecalendar.apechain.com{}", path);
                let resp = client.get(&url).send().await.ok()?;
                let mime = resp.headers()
                    .get("content-type")
                    .and_then(|v| v.to_str().ok())
                    .and_then(|v| v.split(';').next())
                    .unwrap_or("image/png")
                    .to_string();
                let bytes = resp.bytes().await.ok()?;
                Some(format!("data:{};base64,{}", mime,
                    base64::engine::general_purpose::STANDARD.encode(&bytes)))
            }
        })
        .collect();

    for (event, img) in events.iter_mut().zip(futures::future::join_all(image_futures).await) {
        if let Some(data_url) = img {
            event["imageUrl"] = serde_json::Value::String(data_url);
        }
    }

    Ok(serde_json::Value::Array(events))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![fetch_upcoming_events])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            setup_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}

fn setup_tray<R: Runtime>(app: &mut tauri::App<R>) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Open OSWiki", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("OSWiki Launcher")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
