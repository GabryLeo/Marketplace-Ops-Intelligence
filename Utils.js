const APP = {
  NAME: 'Marketplace Ops Intelligence',
  VERSION: 'V1',
  DISCLAIMER: 'DADOS SINTETICOS · PROJETO EDUCACIONAL · NAO OFICIAL',
  SEED: 202601,
  DEFAULT_ADMIN_EMAIL: '',
  DEFAULT_COUNTRY: 'Brasil',
  DEFAULT_DAYS: 180,
  VOLUME: {
    ORDERS: 12000,
    PRODUCTS: 600,
    SELLERS: 250
  }
};

const SHEETS = {
  CONFIG: 'config',
  USERS: 'users',
  SESSIONS: 'sessions',
  FAVORITES: 'favorites',
  ACTIONS: 'actions_log',
  AUDIT: 'audit_log',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PRODUCTS: 'products',
  SELLERS: 'sellers',
  SHIPMENTS: 'shipments',
  PAYMENTS: 'payments',
  REVIEWS: 'reviews',
  ANALYTICS: 'analytics_base',
  KPIS_CACHE: 'kpis_cache',
  EXPLORE_CACHE: 'explore_cache',
  DRILLDOWN_CACHE: 'drilldown_cache',
  COMPARE_CACHE: 'compare_cache',
  ALERTS: 'alerts',
  RECOMMENDATIONS: 'recommendations_cache'
};

const HEADERS = {
  config: ['key', 'value', 'description', 'updated_at'],
  users: ['user_id', 'email', 'role', 'created_at', 'last_login', 'last_tab', 'last_filters_json', 'theme', 'active'],
  sessions: ['session_id', 'user_email', 'created_at', 'last_active_at', 'current_tab', 'state_json', 'last_payload_hash'],
  favorites: ['favorite_id', 'user_email', 'title', 'tab', 'description', 'filters_json', 'created_at', 'last_opened_at', 'pinned'],
  actions_log: ['action_id', 'user_email', 'source_type', 'source_id', 'title', 'problem_detected', 'suggested_action', 'priority', 'owner', 'status', 'notes', 'created_at', 'updated_at'],
  audit_log: ['event_id', 'timestamp', 'user_email', 'event_type', 'tab', 'payload_json'],
  orders: ['order_id', 'order_date', 'buyer_id', 'buyer_country', 'buyer_state', 'seller_id', 'order_status', 'total_gmv', 'net_revenue', 'items_count', 'channel', 'created_at'],
  order_items: ['order_item_id', 'order_id', 'product_id', 'seller_id', 'quantity', 'unit_price', 'item_gmv', 'freight_value'],
  products: ['product_id', 'product_title', 'category', 'subcategory', 'brand', 'price_band', 'condition'],
  sellers: ['seller_id', 'seller_name', 'seller_country', 'seller_state', 'seller_tier', 'reputation_score', 'active_listings', 'registration_date'],
  shipments: ['shipment_id', 'order_id', 'logistic_type', 'promised_delivery_date', 'shipped_date', 'delivered_date', 'delivery_days', 'is_delayed', 'delivered_under_48h', 'shipping_cost'],
  payments: ['payment_id', 'order_id', 'payment_method', 'installments', 'payment_value', 'payment_status'],
  reviews: ['review_id', 'order_id', 'review_score', 'review_comment', 'review_date', 'has_claim', 'claim_reason', 'claim_status', 'csat_score'],
  analytics_base: ['order_id', 'order_date', 'month', 'week', 'buyer_country', 'buyer_state', 'seller_id', 'seller_tier', 'category', 'subcategory', 'product_id', 'product_title', 'logistic_type', 'order_status', 'gmv', 'net_revenue', 'items_count', 'payment_method', 'review_score', 'has_claim', 'claim_reason', 'is_delayed', 'delivered_under_48h', 'delivery_days', 'shipping_cost', 'price_band'],
  kpis_cache: ['cache_key', 'filters_json', 'payload_json', 'updated_at'],
  explore_cache: ['cache_key', 'filters_json', 'payload_json', 'updated_at'],
  drilldown_cache: ['cache_key', 'filters_json', 'payload_json', 'updated_at'],
  compare_cache: ['cache_key', 'filters_json', 'payload_json', 'updated_at'],
  alerts: ['alert_id', 'created_at', 'severity', 'state', 'scope_type', 'scope_value', 'metric', 'current_value', 'threshold', 'message', 'suggested_action', 'status', 'source_query'],
  recommendations_cache: ['recommendation_id', 'state', 'title', 'scope_type', 'scope_value', 'reason', 'suggested_action', 'impact_score', 'confidence', 'created_at', 'filters_json']
};

function ok(data) {
  return { success: true, data: data || null, error: null };
}

function fail(message, detail) {
  return { success: false, data: null, error: { message: message, detail: detail || '' } };
}

function nowIso() {
  return new Date().toISOString();
}

function uuid(prefix) {
  return (prefix || 'id') + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 18);
}

function getSs() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name) {
  const sheet = getSs().getSheetByName(name);
  if (!sheet) throw new Error('Aba nao encontrada: ' + name);
  return sheet;
}

function readObjects(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => row.some(v => v !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendObject(sheetName, obj) {
  const headers = HEADERS[sheetName];
  getSheet(sheetName).appendRow(headers.map(h => obj[h] === undefined ? '' : obj[h]));
}

function writeObjects(sheetName, objects) {
  const sheet = getSheet(sheetName);
  const headers = HEADERS[sheetName];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (objects.length) {
    sheet.getRange(2, 1, objects.length, headers.length).setValues(objects.map(obj => headers.map(h => obj[h] === undefined ? '' : obj[h])));
  }
}

function toNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

function safeJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : (fallback || {});
  } catch (err) {
    return fallback || {};
  }
}

function seededRandom(seed) {
  let x = seed % 2147483647;
  return function () {
    x = x * 16807 % 2147483647;
    return (x - 1) / 2147483646;
  };
}

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

function round(value, digits) {
  const m = Math.pow(10, digits || 0);
  return Math.round(value * m) / m;
}

function logAudit(userEmail, eventType, tab, payload) {
  try {
    if (!getSs().getSheetByName(SHEETS.AUDIT)) return;
    appendObject(SHEETS.AUDIT, {
      event_id: uuid('evt'),
      timestamp: nowIso(),
      user_email: userEmail || '',
      event_type: eventType,
      tab: tab || '',
      payload_json: JSON.stringify(payload || {})
    });
  } catch (err) {
    console.error(err);
  }
}

function isReady() {
  return PropertiesService.getScriptProperties().getProperty('APP_READY') === 'true';
}
