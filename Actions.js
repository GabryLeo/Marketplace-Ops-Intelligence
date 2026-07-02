function listFavorites(email) {
  try {
    const rows = readObjects(SHEETS.FAVORITES)
      .filter(r => String(r.user_email).toLowerCase() === String(email || '').toLowerCase())
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return ok({ favorites: rows });
  } catch (err) {
    return fail('Nao foi possivel carregar salvos.', err.message);
  }
}

function saveFavorite(email, favorite) {
  try {
    const row = {
      favorite_id: uuid('fav'),
      user_email: email,
      title: favorite.title || 'Visao salva',
      tab: favorite.tab || 'overview',
      description: favorite.description || '',
      filters_json: JSON.stringify(favorite.filters || {}),
      created_at: nowIso(),
      last_opened_at: '',
      pinned: favorite.pinned === true
    };
    appendObject(SHEETS.FAVORITES, row);
    logAudit(email, 'save_favorite', row.tab, row);
    return ok(row);
  } catch (err) {
    logAudit(email, 'error', 'saved', { message: err.message });
    return fail('Nao foi possivel salvar a visao.', err.message);
  }
}

function deleteFavorite(email, favoriteId) {
  try {
    deleteRowById_(SHEETS.FAVORITES, 'favorite_id', favoriteId, email);
    logAudit(email, 'delete_favorite', 'saved', { favoriteId: favoriteId });
    return ok({ deleted: true });
  } catch (err) {
    return fail('Nao foi possivel remover a visao.', err.message);
  }
}

function listActions(email) {
  try {
    const rows = readObjects(SHEETS.ACTIONS)
      .filter(r => String(r.user_email).toLowerCase() === String(email || '').toLowerCase())
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return ok({ actions: rows });
  } catch (err) {
    return fail('Nao foi possivel carregar acoes.', err.message);
  }
}

function createAction(email, action) {
  try {
    const existing = readObjects(SHEETS.ACTIONS).find(r =>
      String(r.user_email).toLowerCase() === String(email || '').toLowerCase() &&
      String(r.source_type || '') === String(action.source_type || 'manual') &&
      String(r.source_id || '') === String(action.source_id || '') &&
      String(r.title || '').trim().toLowerCase() === String(action.title || 'Nova acao').trim().toLowerCase() &&
      String(r.status || '') !== 'Arquivada'
    );
    if (existing) return ok(Object.assign({ duplicate: true }, existing));
    const row = {
      action_id: uuid('act'),
      user_email: email,
      source_type: action.source_type || 'manual',
      source_id: action.source_id || '',
      title: action.title || 'Nova acao',
      problem_detected: action.problem_detected || '',
      suggested_action: action.suggested_action || '',
      priority: action.priority || 'Media',
      owner: action.owner || email,
      status: action.status || 'Aberta',
      notes: action.notes || '',
      created_at: nowIso(),
      updated_at: nowIso()
    };
    appendObject(SHEETS.ACTIONS, row);
    logAudit(email, 'create_action', 'actions', row);
    return ok(row);
  } catch (err) {
    logAudit(email, 'error', 'actions', { message: err.message });
    return fail('Nao foi possivel registrar a acao.', err.message);
  }
}

function updateActionStatus(email, actionId, status) {
  try {
    const sheet = getSheet(SHEETS.ACTIONS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    for (let r = 1; r < values.length; r++) {
      if (values[r][headers.indexOf('action_id')] === actionId && values[r][headers.indexOf('user_email')] === email) {
        sheet.getRange(r + 1, headers.indexOf('status') + 1).setValue(status);
        sheet.getRange(r + 1, headers.indexOf('updated_at') + 1).setValue(nowIso());
        logAudit(email, 'update_action', 'actions', { actionId: actionId, status: status });
        return ok({ updated: true });
      }
    }
    return fail('Acao nao encontrada.');
  } catch (err) {
    return fail('Nao foi possivel atualizar a acao.', err.message);
  }
}

function deleteAction(email, actionId) {
  try {
    deleteRowById_(SHEETS.ACTIONS, 'action_id', actionId, email);
    logAudit(email, 'delete_action', 'actions', { actionId: actionId });
    return ok({ deleted: true });
  } catch (err) {
    return fail('Nao foi possivel remover a acao.', err.message);
  }
}

function convertRecommendationToAction(email, recommendationId) {
  const rec = readObjects(SHEETS.RECOMMENDATIONS).find(r => r.recommendation_id === recommendationId);
  if (!rec) return fail('Recomendacao nao encontrada.');
  return createAction(email, {
    source_type: 'recommendation',
    source_id: recommendationId,
    title: rec.title,
    problem_detected: rec.reason,
    suggested_action: rec.suggested_action,
    priority: rec.state === 'Risco' ? 'Alta' : 'Média',
    owner: email,
    status: 'Aberta',
    notes: 'Criada a partir da aba Recomendacoes.'
  });
}

function convertAlertToAction(email, alertId) {
  const alert = readObjects(SHEETS.ALERTS).find(r => r.alert_id === alertId);
  if (!alert) return fail('Alerta nao encontrado.');
  return createAction(email, {
    source_type: 'alert',
    source_id: alertId,
    title: alert.message,
    problem_detected: alert.metric + ': ' + alert.current_value,
    suggested_action: alert.suggested_action,
    priority: alert.severity === 'critical' || alert.severity === 'high' ? 'Alta' : 'Média',
    owner: email,
    status: 'Aberta',
    notes: 'Criada a partir da aba Alertas.'
  });
}

function markAlertSeen(email, alertId) {
  try {
    const sheet = getSheet(SHEETS.ALERTS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    for (let r = 1; r < values.length; r++) {
      if (values[r][headers.indexOf('alert_id')] === alertId) {
        sheet.getRange(r + 1, headers.indexOf('status') + 1).setValue('Visto');
        logAudit(email, 'update_alert', 'alerts', { alertId: alertId, status: 'Visto' });
        return ok({ updated: true });
      }
    }
    return fail('Alerta nao encontrado.');
  } catch (err) {
    return fail('Nao foi possivel marcar o alerta.', err.message);
  }
}

function deleteRowById_(sheetName, idColumn, idValue, email) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIdx = headers.indexOf(idColumn);
  const emailIdx = headers.indexOf('user_email');
  for (let r = values.length - 1; r >= 1; r--) {
    if (values[r][idIdx] === idValue && (emailIdx < 0 || values[r][emailIdx] === email)) {
      sheet.deleteRow(r + 1);
      return;
    }
  }
}
