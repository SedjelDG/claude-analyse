use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, State, Emitter};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpirationEntry {
    pub date: String,
    pub quantity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackVariant {
    pub size: f64,
    pub name: String,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Product {
    pub id: String,
    pub barcodes: Vec<String>,
    pub name: String,
    pub category: String,
    pub brand: String,
    pub price: f64,
    pub cost: f64,
    pub stock: f64,
    pub min_stock: f64,
    pub unit: String,
    pub plu: String,
    pub scale_enabled: bool,
    pub pack_size: f64,
    pub pack_buying_price: f64,
    pub wholesale_enabled: bool,
    pub wholesale_price: f64,
    pub wholesale_min_qty: f64,
    pub expiration_dates: Vec<ExpirationEntry>,
    pub vat_rate: f64,
    pub pack_variants: Vec<PackVariant>,
    pub supplier: String,
    pub image: String,
    pub short_label: String,
    pub button_color: String,
    pub allow_price_override: bool,
    pub is_active: bool,
    pub tare_weight: f64,
    pub label_format: String,
    pub barcode: Option<String>,
}

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(db_path: &PathBuf) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            barcodes JSON,
            name TEXT NOT NULL,
            category TEXT,
            brand TEXT,
            price REAL,
            cost REAL,
            stock REAL,
            min_stock REAL,
            unit TEXT,
            plu TEXT,
            scale_enabled BOOLEAN,
            pack_size REAL,
            pack_buying_price REAL,
            wholesale_enabled BOOLEAN,
            wholesale_price REAL,
            wholesale_min_qty REAL,
            expiration_dates JSON,
            vat_rate REAL,
            pack_variants JSON,
            supplier TEXT,
            image TEXT,
            short_label TEXT,
            button_color TEXT,
            allow_price_override BOOLEAN,
            is_active BOOLEAN,
            tare_weight REAL,
            label_format TEXT,
            barcode TEXT
        )",
        [],
    )?;

    Ok(conn)
}

#[tauri::command]
pub fn get_products(db: State<'_, DbState>) -> Result<Vec<Product>, String> {
    let conn = db.0.lock().map_err(|_| "Failed to lock db")?;
    let mut stmt = conn.prepare("SELECT * FROM products").map_err(|e| e.to_string())?;
    
    let product_iter = stmt.query_map([], |row| {
        let barcodes_str: String = row.get(1)?;
        let expiration_dates_str: String = row.get(17)?;
        let pack_variants_str: String = row.get(19)?;

        Ok(Product {
            id: row.get(0)?,
            barcodes: serde_json::from_str(&barcodes_str).unwrap_or_default(),
            name: row.get(2)?,
            category: row.get(3)?,
            brand: row.get(4)?,
            price: row.get(5)?,
            cost: row.get(6)?,
            stock: row.get(7)?,
            min_stock: row.get(8)?,
            unit: row.get(9)?,
            plu: row.get(10)?,
            scale_enabled: row.get(11)?,
            pack_size: row.get(12)?,
            pack_buying_price: row.get(13)?,
            wholesale_enabled: row.get(14)?,
            wholesale_price: row.get(15)?,
            wholesale_min_qty: row.get(16)?,
            expiration_dates: serde_json::from_str(&expiration_dates_str).unwrap_or_default(),
            vat_rate: row.get(18)?,
            pack_variants: serde_json::from_str(&pack_variants_str).unwrap_or_default(),
            supplier: row.get(20)?,
            image: row.get(21)?,
            short_label: row.get(22)?,
            button_color: row.get(23)?,
            allow_price_override: row.get(24)?,
            is_active: row.get(25)?,
            tare_weight: row.get(26)?,
            label_format: row.get(27)?,
            barcode: row.get(28)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut products = Vec::new();
    for product_res in product_iter {
        products.push(product_res.map_err(|e| e.to_string())?);
    }
    
    Ok(products)
}

#[tauri::command]
pub fn upsert_product(
    product: Product, 
    db: State<'_, DbState>,
    app: AppHandle
) -> Result<Product, String> {
    let conn = db.0.lock().map_err(|_| "Failed to lock db")?;
    
    let barcodes_str = serde_json::to_string(&product.barcodes).map_err(|e| e.to_string())?;
    let expiration_dates_str = serde_json::to_string(&product.expiration_dates).map_err(|e| e.to_string())?;
    let pack_variants_str = serde_json::to_string(&product.pack_variants).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO products (
            id, barcodes, name, category, brand, price, cost, stock, min_stock, 
            unit, plu, scale_enabled, pack_size, pack_buying_price, wholesale_enabled, 
            wholesale_price, wholesale_min_qty, expiration_dates, vat_rate, pack_variants, 
            supplier, image, short_label, button_color, allow_price_override, is_active, 
            tare_weight, label_format, barcode
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 
            ?10, ?11, ?12, ?13, ?14, ?15, 
            ?16, ?17, ?18, ?19, ?20, 
            ?21, ?22, ?23, ?24, ?25, ?26, 
            ?27, ?28, ?29
        )
        ON CONFLICT(id) DO UPDATE SET
            barcodes=excluded.barcodes,
            name=excluded.name,
            category=excluded.category,
            brand=excluded.brand,
            price=excluded.price,
            cost=excluded.cost,
            stock=excluded.stock,
            min_stock=excluded.min_stock,
            unit=excluded.unit,
            plu=excluded.plu,
            scale_enabled=excluded.scale_enabled,
            pack_size=excluded.pack_size,
            pack_buying_price=excluded.pack_buying_price,
            wholesale_enabled=excluded.wholesale_enabled,
            wholesale_price=excluded.wholesale_price,
            wholesale_min_qty=excluded.wholesale_min_qty,
            expiration_dates=excluded.expiration_dates,
            vat_rate=excluded.vat_rate,
            pack_variants=excluded.pack_variants,
            supplier=excluded.supplier,
            image=excluded.image,
            short_label=excluded.short_label,
            button_color=excluded.button_color,
            allow_price_override=excluded.allow_price_override,
            is_active=excluded.is_active,
            tare_weight=excluded.tare_weight,
            label_format=excluded.label_format,
            barcode=excluded.barcode
        ",
        params![
            product.id,
            barcodes_str,
            product.name,
            product.category,
            product.brand,
            product.price,
            product.cost,
            product.stock,
            product.min_stock,
            product.unit,
            product.plu,
            product.scale_enabled,
            product.pack_size,
            product.pack_buying_price,
            product.wholesale_enabled,
            product.wholesale_price,
            product.wholesale_min_qty,
            expiration_dates_str,
            product.vat_rate,
            pack_variants_str,
            product.supplier,
            product.image,
            product.short_label,
            product.button_color,
            product.allow_price_override,
            product.is_active,
            product.tare_weight,
            product.label_format,
            product.barcode,
        ],
    ).map_err(|e| e.to_string())?;

    let _ = app.emit("inventory-update", ());

    Ok(product)
}

#[tauri::command]
pub fn delete_product(id: String, db: State<'_, DbState>, app: AppHandle) -> Result<(), String> {
    let conn = db.0.lock().map_err(|_| "Failed to lock db")?;
    conn.execute(
        "DELETE FROM products WHERE id = ?1",
        params![id],
    ).map_err(|e| e.to_string())?;
    
    let _ = app.emit("inventory-update", ());

    Ok(())
}

#[tauri::command]
pub fn bulk_import_products(
    products: Vec<Product>, 
    db: State<'_, DbState>,
    app: AppHandle
) -> Result<usize, String> {
    let mut conn = db.0.lock().map_err(|_| "Failed to lock db")?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    let mut count = 0;
    {
        let mut stmt = tx.prepare_cached(
            "INSERT INTO products (
                id, barcodes, name, category, brand, price, cost, stock, min_stock, 
                unit, plu, scale_enabled, pack_size, pack_buying_price, wholesale_enabled, 
                wholesale_price, wholesale_min_qty, expiration_dates, vat_rate, pack_variants, 
                supplier, image, short_label, button_color, allow_price_override, is_active, 
                tare_weight, label_format, barcode
            ) VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 
                ?10, ?11, ?12, ?13, ?14, ?15, 
                ?16, ?17, ?18, ?19, ?20, 
                ?21, ?22, ?23, ?24, ?25, ?26, 
                ?27, ?28, ?29
            )
            ON CONFLICT(id) DO UPDATE SET
                barcodes=excluded.barcodes,
                name=excluded.name,
                category=excluded.category,
                brand=excluded.brand,
                price=excluded.price,
                cost=excluded.cost,
                stock=excluded.stock,
                min_stock=excluded.min_stock,
                unit=excluded.unit,
                plu=excluded.plu,
                scale_enabled=excluded.scale_enabled,
                pack_size=excluded.pack_size,
                pack_buying_price=excluded.pack_buying_price,
                wholesale_enabled=excluded.wholesale_enabled,
                wholesale_price=excluded.wholesale_price,
                wholesale_min_qty=excluded.wholesale_min_qty,
                expiration_dates=excluded.expiration_dates,
                vat_rate=excluded.vat_rate,
                pack_variants=excluded.pack_variants,
                supplier=excluded.supplier,
                image=excluded.image,
                short_label=excluded.short_label,
                button_color=excluded.button_color,
                allow_price_override=excluded.allow_price_override,
                is_active=excluded.is_active,
                tare_weight=excluded.tare_weight,
                label_format=excluded.label_format,
                barcode=excluded.barcode
            "
        ).map_err(|e| e.to_string())?;
        
        for product in &products {
            let barcodes_str = serde_json::to_string(&product.barcodes).unwrap_or_default();
            let expiration_dates_str = serde_json::to_string(&product.expiration_dates).unwrap_or_default();
            let pack_variants_str = serde_json::to_string(&product.pack_variants).unwrap_or_default();

            stmt.execute(params![
                product.id,
                barcodes_str,
                product.name,
                product.category,
                product.brand,
                product.price,
                product.cost,
                product.stock,
                product.min_stock,
                product.unit,
                product.plu,
                product.scale_enabled,
                product.pack_size,
                product.pack_buying_price,
                product.wholesale_enabled,
                product.wholesale_price,
                product.wholesale_min_qty,
                expiration_dates_str,
                product.vat_rate,
                pack_variants_str,
                product.supplier,
                product.image,
                product.short_label,
                product.button_color,
                product.allow_price_override,
                product.is_active,
                product.tare_weight,
                product.label_format,
                product.barcode,
            ]).map_err(|e| e.to_string())?;
            count += 1;
        }
    }
    
    tx.commit().map_err(|e| e.to_string())?;
    
    let _ = app.emit("inventory-update", ());

    Ok(count)
}
