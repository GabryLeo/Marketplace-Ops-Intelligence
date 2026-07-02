function generateSyntheticData_() {
  const rand = seededRandom(APP.SEED);
  const categories = ['Eletronicos', 'Moda', 'Casa', 'Beleza', 'Esportes', 'Games', 'Auto', 'Ferramentas', 'Mercado', 'Brinquedos'];
  const states = ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'PE', 'CE', 'GO', 'SC', 'AM', 'PA'];
  const tiers = ['Platinum', 'Gold', 'Silver', 'Standard', 'New'];
  const logistics = ['Full', 'Flex', 'Coleta', 'Drop-off', 'Cross-docking'];
  const methods = ['credit_card', 'debit_card', 'pix', 'wallet', 'boleto'];
  const statuses = ['delivered', 'shipped', 'processing', 'cancelled', 'unavailable'];
  const priceBands = ['Baixo', 'Medio', 'Alto', 'Premium'];
  const products = [];
  const sellers = [];
  const orders = [];
  const items = [];
  const shipments = [];
  const payments = [];
  const reviews = [];
  const today = new Date();

  for (let i = 1; i <= APP.VOLUME.PRODUCTS; i++) {
    const category = pick(rand, categories);
    products.push({
      product_id: 'prd_' + i,
      product_title: category + ' Item ' + i,
      category: category,
      subcategory: category + ' Pro',
      brand: 'Marca ' + (1 + Math.floor(rand() * 35)),
      price_band: pick(rand, priceBands),
      condition: rand() > 0.08 ? 'Novo' : 'Usado'
    });
  }
  for (let i = 1; i <= APP.VOLUME.SELLERS; i++) {
    const tier = pick(rand, tiers);
    sellers.push({
      seller_id: 'sel_' + i,
      seller_name: 'Seller ' + i,
      seller_country: 'Brasil',
      seller_state: pick(rand, states),
      seller_tier: tier,
      reputation_score: round(3.2 + rand() * 1.8, 2),
      active_listings: Math.floor(20 + rand() * 1200),
      registration_date: offsetDate_(today, -Math.floor(40 + rand() * 1200))
    });
  }

  for (let i = 1; i <= APP.VOLUME.ORDERS; i++) {
    const date = offsetDate_(today, -Math.floor(rand() * 240));
    const seller = pick(rand, sellers);
    const product = pick(rand, products);
    const statusBias = product.category === 'Moda' && rand() < 0.08 ? 'cancelled' : pick(rand, statuses);
    const status = rand() < 0.78 ? 'delivered' : statusBias;
    const quantity = 1 + Math.floor(rand() * 3);
    const basePrice = product.price_band === 'Premium' ? 900 : product.price_band === 'Alto' ? 450 : product.price_band === 'Medio' ? 180 : 65;
    const unitPrice = round(basePrice * (0.65 + rand() * 0.9), 2);
    const freight = round(8 + rand() * 45, 2);
    const gmv = round(unitPrice * quantity + freight, 2);
    const orderId = 'ord_' + i;
    const logistic = product.category === 'Eletronicos' && rand() < 0.36 ? 'Drop-off' : pick(rand, logistics);
    const delayBase = logistic === 'Drop-off' ? 0.25 : logistic === 'Full' ? 0.06 : 0.13;
    const delayed = rand() < delayBase || (product.category === 'Eletronicos' && rand() < 0.12);
    const deliveryDays = status === 'delivered' ? Math.floor((delayed ? 5 : 1) + rand() * (delayed ? 10 : 3)) : '';
    const hasClaim = rand() < (seller.seller_tier === 'Platinum' && rand() < 0.2 ? 0.13 : product.category === 'Moda' ? 0.08 : 0.045);
    const reviewScore = status === 'cancelled' ? 2 : round(Math.max(1, Math.min(5, 4.5 - (delayed ? 0.9 : 0) - (hasClaim ? 1.2 : 0) + rand() * 0.6)), 1);

    orders.push({
      order_id: orderId,
      order_date: date,
      buyer_id: 'buy_' + Math.floor(1 + rand() * 9000),
      buyer_country: 'Brasil',
      buyer_state: product.category === 'Casa' && rand() < 0.22 ? pick(rand, ['BA', 'PE', 'CE']) : pick(rand, states),
      seller_id: seller.seller_id,
      order_status: status,
      total_gmv: gmv,
      net_revenue: round(gmv * 0.13, 2),
      items_count: quantity,
      channel: pick(rand, ['web', 'app', 'mshops']),
      created_at: nowIso()
    });
    items.push({
      order_item_id: 'itm_' + i,
      order_id: orderId,
      product_id: product.product_id,
      seller_id: seller.seller_id,
      quantity: quantity,
      unit_price: unitPrice,
      item_gmv: round(unitPrice * quantity, 2),
      freight_value: freight
    });
    shipments.push({
      shipment_id: 'shp_' + i,
      order_id: orderId,
      logistic_type: logistic,
      promised_delivery_date: offsetDate_(new Date(date), 4),
      shipped_date: offsetDate_(new Date(date), 1),
      delivered_date: status === 'delivered' ? offsetDate_(new Date(date), Number(deliveryDays)) : '',
      delivery_days: deliveryDays,
      is_delayed: delayed,
      delivered_under_48h: status === 'delivered' && Number(deliveryDays) <= 2,
      shipping_cost: freight
    });
    payments.push({
      payment_id: 'pay_' + i,
      order_id: orderId,
      payment_method: pick(rand, methods),
      installments: Math.floor(1 + rand() * 10),
      payment_value: gmv,
      payment_status: status === 'cancelled' ? 'refunded' : 'approved'
    });
    if (rand() < 0.82) {
      reviews.push({
        review_id: 'rev_' + i,
        order_id: orderId,
        review_score: reviewScore,
        review_comment: hasClaim ? 'Experiencia precisa de atencao' : 'Compra concluida',
        review_date: offsetDate_(new Date(date), Number(deliveryDays || 3) + 2),
        has_claim: hasClaim,
        claim_reason: hasClaim ? pick(rand, ['Atraso na entrega', 'Produto com defeito', 'Produto diferente do anuncio', 'Cancelamento', 'Atendimento', 'Frete caro']) : 'Sem reclamacao',
        claim_status: hasClaim ? pick(rand, ['Aberta', 'Em analise', 'Resolvida']) : '',
        csat_score: Math.round(reviewScore)
      });
    }
  }

  writeObjects(SHEETS.PRODUCTS, products);
  writeObjects(SHEETS.SELLERS, sellers);
  writeObjects(SHEETS.ORDERS, orders);
  writeObjects(SHEETS.ORDER_ITEMS, items);
  writeObjects(SHEETS.SHIPMENTS, shipments);
  writeObjects(SHEETS.PAYMENTS, payments);
  writeObjects(SHEETS.REVIEWS, reviews);
}

function rebuildAnalyticsBase_() {
  const products = indexBy_(readObjects(SHEETS.PRODUCTS), 'product_id');
  const sellers = indexBy_(readObjects(SHEETS.SELLERS), 'seller_id');
  const shipments = indexBy_(readObjects(SHEETS.SHIPMENTS), 'order_id');
  const payments = indexBy_(readObjects(SHEETS.PAYMENTS), 'order_id');
  const reviews = indexBy_(readObjects(SHEETS.REVIEWS), 'order_id');
  const items = readObjects(SHEETS.ORDER_ITEMS);
  const orders = indexBy_(readObjects(SHEETS.ORDERS), 'order_id');
  const rows = items.map(item => {
    const order = orders[item.order_id] || {};
    const product = products[item.product_id] || {};
    const seller = sellers[item.seller_id] || {};
    const ship = shipments[item.order_id] || {};
    const pay = payments[item.order_id] || {};
    const review = reviews[item.order_id] || {};
    const date = new Date(order.order_date);
    return {
      order_id: item.order_id,
      order_date: order.order_date,
      month: Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM'),
      week: Utilities.formatDate(date, Session.getScriptTimeZone(), 'YYYY-ww'),
      buyer_country: order.buyer_country,
      buyer_state: order.buyer_state,
      seller_id: item.seller_id,
      seller_tier: seller.seller_tier,
      category: product.category,
      subcategory: product.subcategory,
      product_id: item.product_id,
      product_title: product.product_title,
      logistic_type: ship.logistic_type,
      order_status: order.order_status,
      gmv: order.total_gmv,
      net_revenue: order.net_revenue,
      items_count: order.items_count,
      payment_method: pay.payment_method,
      review_score: review.review_score || '',
      has_claim: review.has_claim === true || review.has_claim === 'true',
      claim_reason: review.claim_reason || '',
      is_delayed: ship.is_delayed === true || ship.is_delayed === 'true',
      delivered_under_48h: ship.delivered_under_48h === true || ship.delivered_under_48h === 'true',
      delivery_days: ship.delivery_days,
      shipping_cost: ship.shipping_cost,
      price_band: product.price_band
    };
  });
  writeObjects(SHEETS.ANALYTICS, rows);
}

function getTabData(tab, filters, email) {
  try {
    if (!isReady()) return fail('App ainda nao configurado.');
    const cleanFilters = filters || {};
    const data = tab === 'overview' ? getOverview_(cleanFilters)
      : tab === 'explore' ? getExplore_(cleanFilters)
      : tab === 'recommendations' ? { recommendations: readObjects(SHEETS.RECOMMENDATIONS).slice(0, 24) }
      : tab === 'alerts' ? { alerts: readObjects(SHEETS.ALERTS).slice(0, 40) }
      : tab === 'saved' ? listFavorites(email).data
      : tab === 'actions' ? listActions(email).data
      : tab === 'drilldown' ? getDrilldown_(cleanFilters)
      : tab === 'compare' ? getCompare_(cleanFilters)
      : {};
    logAudit(email, 'refresh_tab', tab, { filters: cleanFilters });
    return ok(Object.assign({ updatedAt: nowIso() }, data));
  } catch (err) {
    logAudit(email, 'error', tab, { message: err.message });
    return fail('Nao foi possivel atualizar esta aba agora.', err.message);
  }
}

function getOverview_(filters) {
  const rows = applyFilters_(readObjects(SHEETS.ANALYTICS), filters);
  const kpis = aggregateKpis_(rows);
  const byMonth = groupMetric_(rows, 'month');
  const byCategory = groupMetric_(rows, 'category').slice(0, 8);
  const recommendations = readObjects(SHEETS.RECOMMENDATIONS).slice(0, 4);
  return { kpis: kpis, trend: byMonth, composition: byCategory, recommendations: recommendations, summary: buildSummary_(kpis) };
}

function getExplore_(filters) {
  const result = applyFiltersSmart_(readObjects(SHEETS.ANALYTICS), filters);
  const rows = result.rows;
  const grouped = groupDetailed_(rows, ['category', 'buyer_state', 'seller_id']).slice(0, 250);
  return {
    rows: grouped,
    chart: groupMetric_(rows, filters.dimension || 'category').slice(0, 10),
    relaxed: result.relaxed,
    effectiveFilters: result.effectiveFilters,
    query: buildQueryPreview_(filters, filters.dimension || 'category')
  };
}

function getDrilldown_(filters) {
  const dimension = filters.dimension || 'category';
  const result = applyFiltersSmart_(readObjects(SHEETS.ANALYTICS), filters);
  return { dimension: dimension, rows: groupMetric_(result.rows, dimension).slice(0, 30), relaxed: result.relaxed, effectiveFilters: result.effectiveFilters, query: buildQueryPreview_(filters, dimension) };
}

function getCompare_(filters) {
  const dimension = filters.dimension || 'category';
  const selected = Array.isArray(filters.compareItems) && filters.compareItems.length
    ? filters.compareItems
    : [filters.a || 'Eletronicos', filters.b || 'Casa'];
  const rows = readObjects(SHEETS.ANALYTICS);
  const scenarios = selected.map(value => {
    const filter = { [dimension]: value };
    return { label: value, kpis: aggregateKpis_(applyFilters_(rows, filter)) };
  });
  const base = scenarios[0] ? scenarios[0].kpis : aggregateKpis_([]);
  const deltas = scenarios.slice(1).map(item => ({
    scenario: item.label + ' vs ' + scenarios[0].label,
    delta: compareKpis_(item.kpis, base)
  }));
  return {
    dimension: dimension,
    scenarios: scenarios,
    deltas: deltas,
    a: scenarios[0] || { label: selected[0], kpis: aggregateKpis_([]) },
    b: scenarios[1] || { label: selected[1], kpis: aggregateKpis_([]) },
    delta: scenarios[1] ? compareKpis_(scenarios[1].kpis, base) : {}
  };
}

function rebuildDecisionCaches_() {
  const rows = readObjects(SHEETS.ANALYTICS);
  const byCategory = groupDetailed_(rows, ['category']);
  const alerts = [];
  const recs = [];
  byCategory.forEach(g => {
    if (g.delayRate > 0.18) {
      alerts.push(makeAlert_('high', 'Risco', 'category', g.category, 'delay_rate', g.delayRate, 0.18, 'Muitas entregas atrasadas em ' + g.category, 'Identificar lojas e formas de entrega que mais puxam o atraso.'));
      recs.push(makeRec_('Risco', 'Reduzir atrasos em ' + g.category, 'category', g.category, 'A categoria tem muitas vendas simuladas e atraso acima do ideal.', 'Acompanhar as lojas com maior impacto e revisar prazos de entrega.', 88, 0.82));
    }
    if (g.claimRate < 0.04 && g.gmv > 500000) {
      recs.push(makeRec_('Oportunidade', g.category + ' tem boa demanda e poucos problemas', 'category', g.category, 'A categoria combina vendas simuladas altas com boa experiencia do comprador.', 'Explorar mais produtos, campanhas e acompanhamento desse grupo.', 76, 0.74));
    }
    if (g.cancelRate > 0.06) {
      alerts.push(makeAlert_('medium', 'Atenção', 'category', g.category, 'cancel_rate', g.cancelRate, 0.06, 'Cancelamentos acima do esperado em ' + g.category, 'Investigar disponibilidade, prazo prometido e expectativa do comprador.'));
    }
  });
  groupDetailed_(rows, ['seller_id']).filter(g => g.orders > 90 && g.claimRate > 0.08).slice(0, 8).forEach(g => {
    recs.push(makeRec_('Risco', 'Loja parceira com muitas vendas e muitos problemas', 'seller', g.seller_id, 'Esta loja tem volume relevante e problemas reportados acima do limite.', 'Criar acompanhamento com responsavel e proximos passos claros.', 82, 0.78));
  });
  writeObjects(SHEETS.ALERTS, alerts);
  writeObjects(SHEETS.RECOMMENDATIONS, recs.sort((a, b) => b.impact_score - a.impact_score));
}

function aggregateKpis_(rows) {
  const orders = {};
  const sellers = {};
  const cats = {};
  let gmv = 0, cancelled = 0, delayed = 0, under48 = 0, claims = 0, reviewSum = 0, reviewCount = 0;
  rows.forEach(r => {
    if (!orders[r.order_id]) {
      orders[r.order_id] = true;
      gmv += toNumber(r.gmv);
      if (r.order_status === 'cancelled') cancelled++;
      if (r.is_delayed === true || r.is_delayed === 'true') delayed++;
      if (r.delivered_under_48h === true || r.delivered_under_48h === 'true') under48++;
      if (r.has_claim === true || r.has_claim === 'true') claims++;
    }
    sellers[r.seller_id] = true;
    cats[r.category] = true;
    if (r.review_score !== '') {
      reviewSum += toNumber(r.review_score);
      reviewCount++;
    }
  });
  const totalOrders = Object.keys(orders).length;
  const total = totalOrders || 1;
  const delayRate = delayed / total;
  const cancelRate = cancelled / total;
  const claimRate = claims / total;
  const reviewAvg = reviewCount ? reviewSum / reviewCount : 0;
  return {
    gmv: round(gmv, 2),
    orders: totalOrders,
    avgTicket: totalOrders ? round(gmv / totalOrders, 2) : 0,
    cancelRate: round(cancelRate, 4),
    delayRate: round(delayRate, 4),
    under48Rate: round(under48 / total, 4),
    claims: claims,
    claimRate: round(claimRate, 4),
    avgReview: round(reviewAvg, 2),
    activeSellers: Object.keys(sellers).length,
    criticalCategories: Object.keys(cats).length,
    state: operationalState_(delayRate, cancelRate, claimRate, reviewAvg)
  };
}

function groupMetric_(rows, key) {
  const map = {};
  rows.forEach(r => {
    const name = r[key] || 'N/D';
    if (!map[name]) map[name] = [];
    map[name].push(r);
  });
  return Object.keys(map).map(k => Object.assign({ label: k }, aggregateKpis_(map[k]))).sort((a, b) => b.gmv - a.gmv);
}

function groupDetailed_(rows, keys) {
  const map = {};
  rows.forEach(r => {
    const id = keys.map(k => r[k] || 'N/D').join('|');
    if (!map[id]) map[id] = [];
    map[id].push(r);
  });
  return Object.keys(map).map(id => {
    const first = map[id][0];
    return Object.assign({}, keys.reduce((o, k) => (o[k] = first[k] || 'N/D', o), {}), aggregateKpis_(map[id]));
  }).sort((a, b) => b.gmv - a.gmv);
}

function applyFilters_(rows, filters) {
  filters = filters || {};
  return rows.filter(r => {
    if (filters.category && r.category !== filters.category) return false;
    if (filters.buyer_state && r.buyer_state !== filters.buyer_state) return false;
    if (filters.seller_id && r.seller_id !== filters.seller_id) return false;
    if (filters.logistic_type && r.logistic_type !== filters.logistic_type) return false;
    if (filters.order_status && r.order_status !== filters.order_status) return false;
    if (filters.startDate && new Date(r.order_date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(r.order_date) > new Date(filters.endDate)) return false;
    return true;
  });
}

function applyFiltersSmart_(rows, filters) {
  filters = Object.assign({}, filters || {});
  let filtered = applyFilters_(rows, filters);
  if (filtered.length) return { rows: filtered, effectiveFilters: filters, relaxed: [] };

  const relaxOrder = ['seller_id', 'order_status', 'logistic_type', 'buyer_state'];
  const relaxed = [];
  relaxOrder.forEach(key => {
    if (!filtered.length && filters[key]) {
      relaxed.push(key);
      delete filters[key];
      filtered = applyFilters_(rows, filters);
    }
  });

  if (!filtered.length && filters.category) {
    relaxed.push('category');
    delete filters.category;
    filtered = applyFilters_(rows, filters);
  }

  return { rows: filtered, effectiveFilters: filters, relaxed: relaxed };
}

function operationalState_(delayRate, cancelRate, claimRate, reviewAvg) {
  if (delayRate > 0.18 || cancelRate > 0.06 || claimRate > 0.08 || reviewAvg < 3.7) return 'Risco';
  if (delayRate >= 0.10 || cancelRate >= 0.03 || claimRate >= 0.04 || reviewAvg < 4.2) return 'Atenção';
  return 'Saudável';
}

function makeAlert_(severity, state, scopeType, scopeValue, metric, current, threshold, message, action) {
  return { alert_id: uuid('alt'), created_at: nowIso(), severity: severity, state: state, scope_type: scopeType, scope_value: scopeValue, metric: metric, current_value: round(current, 4), threshold: threshold, message: message, suggested_action: action, status: 'Novo', source_query: buildQueryPreview_({}, scopeType) };
}

function makeRec_(state, title, scopeType, scopeValue, reason, action, impact, confidence) {
  return { recommendation_id: uuid('rec'), state: state, title: title, scope_type: scopeType, scope_value: scopeValue, reason: reason, suggested_action: action, impact_score: impact, confidence: confidence, created_at: nowIso(), filters_json: JSON.stringify({ [scopeType]: scopeValue }) };
}

function buildSummary_(kpis) {
  return 'A simulação está em estado ' + kpis.state + ', com ' + kpis.orders + ' pedidos analisados, ' + Math.round(kpis.delayRate * 100) + '% de entregas atrasadas e avaliação média ' + kpis.avgReview + '.';
}

function buildQueryPreview_(filters, groupBy) {
  const labels = {
    category: 'categoria',
    buyer_state: 'estado do comprador',
    seller_id: 'loja parceira',
    logistic_type: 'tipo de entrega',
    order_status: 'situacao do pedido',
    month: 'mes'
  };
  return 'Agrupar por ' + (labels[groupBy] || groupBy) + '; contar pedidos; somar vendas simuladas; calcular avaliacao media e atraso; aplicar filtros selecionados; ordenar pelo maior resultado.';
}

function compareKpis_(a, b) {
  return {
    gmv: pctDelta_(a.gmv, b.gmv),
    orders: pctDelta_(a.orders, b.orders),
    delayRate: pctDelta_(a.delayRate, b.delayRate),
    claimRate: pctDelta_(a.claimRate, b.claimRate),
    avgReview: pctDelta_(a.avgReview, b.avgReview)
  };
}

function pctDelta_(a, b) {
  return b ? round((a - b) / b, 4) : 0;
}

function indexBy_(rows, key) {
  return rows.reduce((acc, row) => (acc[row[key]] = row, acc), {});
}

function offsetDate_(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
