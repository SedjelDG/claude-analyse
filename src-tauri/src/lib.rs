use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

pub mod db;

#[derive(Serialize)]
struct AppInfo {
    name: String,
    version: String,
    platform: String,
    is_packaged: bool,
}

#[derive(Serialize)]
struct AppPaths {
    user_data: String,
    documents: String,
    temp: String,
}

#[derive(Serialize)]
struct DatabaseStatus {
    driver: String,
    configured: bool,
    connected: bool,
    database_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CartItem {
    id: String,
    name: String,
    quantity: f64,
    price: f64,
    barcode: Option<String>,
    pack_variant_index: Option<i32>,
    pack_size: f64,
    original_name: Option<String>,
    original_price: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RegisterSessionState {
    register_id: String,
    active_client: i32,
    discount: f64,
    discount_type: Option<String>,
    client_carts: std::collections::HashMap<String, Vec<CartItem>>,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RegisterShift {
    id: String,
    register_id: String,
    opened_by_user_id: String,
    opened_by_user_name: String,
    opened_at: String,
    closed_at: Option<String>,
    status: String,
    opening_float: f64,
    closing_balance: Option<f64>,
    notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaleItem {
    id: String,
    name: String,
    quantity: f64,
    price: f64,
    barcode: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Sale {
    id: String,
    timestamp: String,
    items: Vec<SaleItem>,
    subtotal: f64,
    discount: f64,
    discount_type: Option<String>,
    total: f64,
    payment_method: String,
    client_number: i32,
    cashier_name: String,
    cashier_id: String,
    refunded_items: Option<Vec<String>>,
    fully_refunded: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaleDraft {
    items: Vec<SaleItem>,
    subtotal: f64,
    discount: f64,
    discount_type: Option<String>,
    total: f64,
    payment_method: String,
    client_number: i32,
    cashier_name: String,
    cashier_id: String,
    refunded_items: Option<Vec<String>>,
    fully_refunded: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FinalizeRegisterCheckoutPayload {
    sale: SaleDraft,
    session: RegisterSessionState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CashMovement {
    id: String,
    r#type: String,
    amount: f64,
    timestamp: String,
    note: String,
    user_id: String,
    user_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionSaveResult {
    ok: bool,
    updated_at: String,
}

fn app_data_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path()
        .app_local_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir())
}

fn ensure_app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app_data_dir(app);
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn register_session_path(app: &tauri::AppHandle, register_id: &str) -> Result<PathBuf, String> {
    let dir = ensure_app_data_dir(app)?;
    Ok(dir.join(format!("{register_id}.session.json")))
}

fn sales_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = ensure_app_data_dir(app)?;
    Ok(dir.join("sales.json"))
}

fn shifts_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = ensure_app_data_dir(app)?;
    Ok(dir.join("shifts.json"))
}

fn cash_movements_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = ensure_app_data_dir(app)?;
    Ok(dir.join("cash-movements.json"))
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = ensure_app_data_dir(app)?;
    Ok(dir.join("settings-store.json"))
}

#[tauri::command]
fn app_get_info(app: tauri::AppHandle) -> AppInfo {
    AppInfo {
        name: app.package_info().name.clone(),
        version: app.package_info().version.to_string(),
        platform: std::env::consts::OS.to_string(),
        is_packaged: !cfg!(debug_assertions),
    }
}

#[tauri::command]
fn app_get_paths(app: tauri::AppHandle) -> AppPaths {
    let path_resolver = app.path();
    AppPaths {
        user_data: path_resolver
            .app_local_data_dir()
            .unwrap_or_else(|_| std::env::temp_dir())
            .display()
            .to_string(),
        documents: dirs::document_dir()
            .unwrap_or_else(std::env::temp_dir)
            .display()
            .to_string(),
        temp: std::env::temp_dir().display().to_string(),
    }
}

#[tauri::command]
fn db_status(app: tauri::AppHandle) -> DatabaseStatus {
    let db_path = app_data_dir(&app).join("pos.sqlite");

    DatabaseStatus {
        driver: "sqlite".to_string(),
        configured: true,
        connected: false,
        database_path: db_path.display().to_string(),
    }
}

#[tauri::command]
fn register_load_session(
    app: tauri::AppHandle,
    register_id: Option<String>,
) -> Result<Option<RegisterSessionState>, String> {
    let register_id = register_id.unwrap_or_else(|| "register-main".to_string());
    let path = register_session_path(&app, &register_id)?;
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let session = serde_json::from_str::<RegisterSessionState>(&content)
        .map_err(|error| error.to_string())?;
    Ok(Some(session))
}

#[tauri::command]
fn register_save_session(
    app: tauri::AppHandle,
    session: RegisterSessionState,
) -> Result<SessionSaveResult, String> {
    let path = register_session_path(&app, &session.register_id)?;
    let updated_at = session.updated_at.clone();
    let payload = serde_json::to_string_pretty(&session).map_err(|error| error.to_string())?;
    fs::write(path, payload).map_err(|error| error.to_string())?;

    Ok(SessionSaveResult {
        ok: true,
        updated_at,
    })
}

#[tauri::command]
fn sales_list(app: tauri::AppHandle) -> Result<Vec<Sale>, String> {
    let path = sales_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let sales = serde_json::from_str::<Vec<Sale>>(&content).map_err(|error| error.to_string())?;
    Ok(sales)
}

#[tauri::command]
fn sales_create(app: tauri::AppHandle, mut sale: Sale) -> Result<Sale, String> {
    let path = sales_path(&app)?;
    let mut sales = if path.exists() {
        let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
        serde_json::from_str::<Vec<Sale>>(&content).map_err(|error| error.to_string())?
    } else {
        Vec::new()
    };

    sale.id = format!(
        "sale-{}-{}",
        chrono_like_timestamp(),
        nano_suffix()
    );
    sale.timestamp = iso_timestamp();

    sales.insert(0, sale.clone());
    let payload = serde_json::to_string_pretty(&sales).map_err(|error| error.to_string())?;
    fs::write(path, payload).map_err(|error| error.to_string())?;

    Ok(sale)
}

#[tauri::command]
fn sales_finalize_register_checkout(
    app: tauri::AppHandle,
    payload: FinalizeRegisterCheckoutPayload,
) -> Result<Sale, String> {
    let sale = Sale {
        id: String::new(),
        timestamp: String::new(),
        items: payload.sale.items,
        subtotal: payload.sale.subtotal,
        discount: payload.sale.discount,
        discount_type: payload.sale.discount_type,
        total: payload.sale.total,
        payment_method: payload.sale.payment_method,
        client_number: payload.sale.client_number,
        cashier_name: payload.sale.cashier_name,
        cashier_id: payload.sale.cashier_id,
        refunded_items: payload.sale.refunded_items,
        fully_refunded: payload.sale.fully_refunded,
    };

    let saved_sale = sales_create(app.clone(), sale)?;
    let mut session = payload.session;
    session.updated_at = iso_timestamp();
    register_save_session(app, session)?;

    Ok(saved_sale)
}

#[tauri::command]
fn sales_refund(app: tauri::AppHandle, sale_id: String) -> Result<Sale, String> {
    let path = sales_path(&app)?;
    if !path.exists() {
        return Err("Sales file not found".to_string());
    }

    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let mut sales = serde_json::from_str::<Vec<Sale>>(&content).map_err(|error| error.to_string())?;

    let mut updated_sale = None;
    for sale in sales.iter_mut() {
        if sale.id == sale_id {
            sale.fully_refunded = Some(true);
            sale.refunded_items = Some(sale.items.iter().map(|item| item.id.clone()).collect());
            updated_sale = Some(sale.clone());
            break;
        }
    }

    if updated_sale.is_none() {
        return Err("Sale not found".to_string());
    }

    let payload = serde_json::to_string_pretty(&sales).map_err(|error| error.to_string())?;
    fs::write(path, payload).map_err(|error| error.to_string())?;

    Ok(updated_sale.unwrap())
}

#[tauri::command]
fn sales_refund_items(app: tauri::AppHandle, sale_id: String, item_ids: Vec<String>) -> Result<Sale, String> {
    let path = sales_path(&app)?;
    if !path.exists() {
        return Err("Sales file not found".to_string());
    }

    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let mut sales = serde_json::from_str::<Vec<Sale>>(&content).map_err(|error| error.to_string())?;

    let mut updated_sale = None;
    for sale in sales.iter_mut() {
        if sale.id == sale_id {
            let mut existing_refunded = sale.refunded_items.clone().unwrap_or_default();
            for item_id in item_ids.iter() {
                if !existing_refunded.contains(item_id) {
                    existing_refunded.push(item_id.clone());
                }
            }
            if existing_refunded.len() >= sale.items.len() {
                sale.fully_refunded = Some(true);
            }
            sale.refunded_items = Some(existing_refunded);
            updated_sale = Some(sale.clone());
            break;
        }
    }

    if updated_sale.is_none() {
        return Err("Sale not found".to_string());
    }

    let payload = serde_json::to_string_pretty(&sales).map_err(|error| error.to_string())?;
    fs::write(path, payload).map_err(|error| error.to_string())?;

    Ok(updated_sale.unwrap())
}

#[tauri::command]
fn shift_get_active(
    app: tauri::AppHandle,
    register_id: Option<String>,
) -> Result<Option<RegisterShift>, String> {
    let path = shifts_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }

    let register_id = register_id.unwrap_or_else(|| "register-main".to_string());
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let shifts =
        serde_json::from_str::<Vec<RegisterShift>>(&content).map_err(|error| error.to_string())?;

    Ok(shifts
        .into_iter()
        .filter(|shift| shift.register_id == register_id && shift.status == "open")
        .max_by(|left, right| left.opened_at.cmp(&right.opened_at)))
}

#[tauri::command]
fn shift_ensure_active(
    app: tauri::AppHandle,
    register_id: String,
    user_id: String,
    user_name: String,
    opening_float: Option<f64>,
) -> Result<RegisterShift, String> {
    if let Some(existing) = shift_get_active(app.clone(), Some(register_id.clone()))? {
        return Ok(existing);
    }

    let path = shifts_path(&app)?;
    let mut shifts = if path.exists() {
        let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
        serde_json::from_str::<Vec<RegisterShift>>(&content).map_err(|error| error.to_string())?
    } else {
        Vec::new()
    };

    let shift = RegisterShift {
        id: format!("shift-{}-{}", chrono_like_timestamp(), nano_suffix()),
        register_id,
        opened_by_user_id: user_id,
        opened_by_user_name: user_name,
        opened_at: iso_timestamp(),
        closed_at: None,
        status: "open".to_string(),
        opening_float: opening_float.unwrap_or(0.0),
        closing_balance: None,
        notes: None,
    };

    shifts.push(shift.clone());
    let payload = serde_json::to_string_pretty(&shifts).map_err(|error| error.to_string())?;
    fs::write(path, payload).map_err(|error| error.to_string())?;

    Ok(shift)
}

#[tauri::command]
fn shift_close_active(
    app: tauri::AppHandle,
    register_id: String,
    user_id: String,
    user_name: String,
    closing_balance: f64,
    notes: Option<String>,
) -> Result<Option<RegisterShift>, String> {
    let path = shifts_path(&app)?;
    if !path.exists() {
      return Ok(None);
    }

    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let mut shifts =
        serde_json::from_str::<Vec<RegisterShift>>(&content).map_err(|error| error.to_string())?;

    let mut closed_shift: Option<RegisterShift> = None;
    for shift in shifts.iter_mut().rev() {
        if shift.register_id == register_id && shift.status == "open" {
            shift.status = "closed".to_string();
            shift.closed_at = Some(iso_timestamp());
            shift.closing_balance = Some(closing_balance);
            if notes.is_some() {
                shift.notes = notes.clone();
            }
            closed_shift = Some(shift.clone());
            break;
        }
    }

    if closed_shift.is_none() {
        return Ok(None);
    }

    let payload = serde_json::to_string_pretty(&shifts).map_err(|error| error.to_string())?;
    fs::write(path, payload).map_err(|error| error.to_string())?;

    let _ = (user_id, user_name);
    Ok(closed_shift)
}

#[tauri::command]
fn cash_list(app: tauri::AppHandle) -> Result<Vec<CashMovement>, String> {
    let path = cash_movements_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let movements =
        serde_json::from_str::<Vec<CashMovement>>(&content).map_err(|error| error.to_string())?;
    Ok(movements)
}

#[tauri::command]
fn cash_create(
    app: tauri::AppHandle,
    mut movement: CashMovement,
) -> Result<CashMovement, String> {
    let path = cash_movements_path(&app)?;
    let mut movements = if path.exists() {
        let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
        serde_json::from_str::<Vec<CashMovement>>(&content).map_err(|error| error.to_string())?
    } else {
        Vec::new()
    };

    movement.id = format!("cash-{}-{}", chrono_like_timestamp(), nano_suffix());
    movement.timestamp = iso_timestamp();

    movements.push(movement.clone());
    let payload = serde_json::to_string_pretty(&movements).map_err(|error| error.to_string())?;
    fs::write(path, payload).map_err(|error| error.to_string())?;

    Ok(movement)
}

#[tauri::command]
fn settings_get(app: tauri::AppHandle, key: String) -> Result<Option<Value>, String> {
    let path = settings_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let store =
        serde_json::from_str::<std::collections::HashMap<String, Value>>(&content)
            .map_err(|error| error.to_string())?;
    Ok(store.get(&key).cloned())
}

#[tauri::command]
fn settings_save(app: tauri::AppHandle, key: String, value: Value) -> Result<SessionSaveResult, String> {
    let path = settings_path(&app)?;
    let mut store = if path.exists() {
        let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
        serde_json::from_str::<std::collections::HashMap<String, Value>>(&content)
            .map_err(|error| error.to_string())?
    } else {
        std::collections::HashMap::new()
    };

    store.insert(key, value);
    let updated_at = iso_timestamp();
    let payload = serde_json::to_string_pretty(&store).map_err(|error| error.to_string())?;
    fs::write(path, payload).map_err(|error| error.to_string())?;

    Ok(SessionSaveResult {
        ok: true,
        updated_at,
    })
}

fn chrono_like_timestamp() -> String {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

fn nano_suffix() -> String {
    format!("{:x}", rand_seed())
}

fn rand_seed() -> u128 {
    std::time::SystemTime::now()
        .elapsed()
        .map(|duration| duration.as_nanos())
        .unwrap_or(0)
}

fn iso_timestamp() -> String {
    let now = std::time::SystemTime::now();
    let datetime: chrono_stub::DateTime = now.into();
    datetime.to_iso_string()
}

mod chrono_stub {
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    pub struct DateTime {
        inner: SystemTime,
    }

    impl From<SystemTime> for DateTime {
        fn from(value: SystemTime) -> Self {
            Self { inner: value }
        }
    }

    impl DateTime {
        pub fn to_iso_string(&self) -> String {
            let duration = self
                .inner
                .duration_since(UNIX_EPOCH)
                .unwrap_or(Duration::from_secs(0));
            format!("{}.{:03}Z", duration.as_secs(), duration.subsec_millis())
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            app_get_info,
            app_get_paths,
            db_status,
            register_load_session,
            register_save_session,
            sales_list,
            sales_create,
            sales_finalize_register_checkout,
            sales_refund,
            sales_refund_items,
            shift_get_active,
            shift_ensure_active,
            shift_close_active,
            cash_list,
            cash_create,
            settings_get,
            settings_save,
            db::get_products,
            db::upsert_product,
            db::delete_product,
            db::bulk_import_products,
        ])
        .setup(|app| {
            let db_path = app_data_dir(app.handle()).join("pos.sqlite");
            let conn = db::init_db(&db_path).expect("failed to initialize db");
            app.manage(db::DbState(std::sync::Mutex::new(conn)));

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
