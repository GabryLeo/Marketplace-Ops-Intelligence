function setupApp() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    createSheets_();
    seedConfig_();
    seedAdmin_();
    generateSyntheticData_();
    rebuildAnalyticsBase_();
    rebuildDecisionCaches_();

    const props = PropertiesService.getScriptProperties();
    props.setProperty('APP_READY', 'true');
    props.setProperty('APP_VERSION', APP.VERSION);
    props.setProperty('SETUP_DATE', nowIso());
    props.setProperty('LAST_GLOBAL_REFRESH', nowIso());
    logAudit('', 'setup_run', '', { version: APP.VERSION });
    return ok({ ready: true, version: APP.VERSION });
  } catch (err) {
    logAudit('', 'error', 'setup', { message: err.message });
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function resetSyntheticData() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    generateSyntheticData_();
    rebuildAnalyticsBase_();
    rebuildDecisionCaches_();
    PropertiesService.getScriptProperties().setProperty('LAST_GLOBAL_REFRESH', nowIso());
    logAudit('', 'setup_run', 'reset', {});
    return ok({ refreshedAt: nowIso() });
  } finally {
    lock.releaseLock();
  }
}

function createSheets_() {
  const ss = getSs();
  Object.keys(HEADERS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.clear();
    sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS[name].length);
  });
}

function seedConfig_() {
  const rows = [
    ['APP_VERSION', APP.VERSION, 'Versao atual do app', nowIso()],
    ['APP_READY', 'false', 'Flag de setup finalizado', nowIso()],
    ['DEFAULT_DATE_RANGE_DAYS', APP.DEFAULT_DAYS, 'Periodo padrao', nowIso()],
    ['DEFAULT_COUNTRY', APP.DEFAULT_COUNTRY, 'Pais padrao', nowIso()],
    ['ADMIN_EMAILS', APP.DEFAULT_ADMIN_EMAIL, 'Admins separados por virgula', nowIso()],
    ['THEME_NAME', 'Midnight Marketplace', 'Tema visual', nowIso()],
    ['DELAY_RATE_ATTENTION', 0.10, 'Atraso atencao', nowIso()],
    ['DELAY_RATE_RISK', 0.18, 'Atraso risco', nowIso()],
    ['CANCEL_RATE_ATTENTION', 0.03, 'Cancelamento atencao', nowIso()],
    ['CANCEL_RATE_RISK', 0.06, 'Cancelamento risco', nowIso()],
    ['CLAIM_RATE_ATTENTION', 0.04, 'Reclamacao atencao', nowIso()],
    ['CLAIM_RATE_RISK', 0.08, 'Reclamacao risco', nowIso()]
  ];
  getSheet(SHEETS.CONFIG).getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function seedAdmin_() {
  if (!APP.DEFAULT_ADMIN_EMAIL) return;
  appendObject(SHEETS.USERS, {
    user_id: uuid('usr'),
    email: APP.DEFAULT_ADMIN_EMAIL.toLowerCase(),
    role: 'admin',
    created_at: nowIso(),
    last_login: '',
    last_tab: 'overview',
    last_filters_json: '{}',
    theme: 'dark',
    active: true
  });
}

function login(email) {
  try {
    if (!isReady()) return fail('App ainda nao configurado. Rode setupApp() na planilha.');
    email = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Informe um e-mail valido.');

    const users = readObjects(SHEETS.USERS);
    const admins = String(getConfig_('ADMIN_EMAILS') || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    let user = users.find(u => String(u.email).toLowerCase() === email);
    if (!user) {
      user = {
        user_id: uuid('usr'),
        email: email,
        role: admins.indexOf(email) >= 0 ? 'admin' : 'user',
        created_at: nowIso(),
        last_login: nowIso(),
        last_tab: 'overview',
        last_filters_json: '{}',
        theme: 'dark',
        active: true
      };
      appendObject(SHEETS.USERS, user);
    } else {
      updateUser_(email, { last_login: nowIso() });
    }

    const session = {
      session_id: uuid('ses'),
      user_email: email,
      created_at: nowIso(),
      last_active_at: nowIso(),
      current_tab: user.last_tab || 'overview',
      state_json: user.last_filters_json || '{}',
      last_payload_hash: ''
    };
    appendObject(SHEETS.SESSIONS, session);
    logAudit(email, 'login', '', {});
    return ok({
      user: Object.assign({}, user, { last_login: nowIso() }),
      session: session,
      config: getPublicConfig_(),
      initialTab: user.last_tab || 'overview',
      filters: safeJson(user.last_filters_json, {})
    });
  } catch (err) {
    logAudit(email, 'error', 'login', { message: err.message });
    return fail('Nao foi possivel entrar agora.', err.message);
  }
}

function getInitialPayload(email) {
  const overview = getTabData('overview', {}, email);
  const favorites = listFavorites(email);
  return ok({ overview: overview.data, favorites: favorites.data });
}

function updateSessionState(email, tab, filters) {
  updateUser_(email, { last_tab: tab, last_filters_json: JSON.stringify(filters || {}) });
  logAudit(email, 'open_tab', tab, { filters: filters || {} });
  return ok({ saved: true });
}

function updateUser_(email, patch) {
  const sheet = getSheet(SHEETS.USERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][headers.indexOf('email')]).toLowerCase() === email) {
      Object.keys(patch).forEach(k => {
        const c = headers.indexOf(k);
        if (c >= 0) sheet.getRange(r + 1, c + 1).setValue(patch[k]);
      });
      return;
    }
  }
}

function getConfig_(key) {
  const row = readObjects(SHEETS.CONFIG).find(r => r.key === key);
  return row ? row.value : '';
}

function getPublicConfig_() {
  return {
    appName: APP.NAME,
    version: APP.VERSION,
    disclaimer: APP.DISCLAIMER,
    lastGlobalRefresh: PropertiesService.getScriptProperties().getProperty('LAST_GLOBAL_REFRESH')
  };
}
