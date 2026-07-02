function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  template.appReady = isReady();
  template.appName = APP.NAME;
  template.disclaimer = APP.DISCLAIMER;
  return template.evaluate()
    .setTitle(APP.NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Marketplace Ops')
    .addItem('Rodar setup inicial', 'setupApp')
    .addItem('Regenerar dados sinteticos', 'resetSyntheticData')
    .addItem('Verificar status', 'showAppStatus')
    .addToUi();
}

function showAppStatus() {
  const props = PropertiesService.getScriptProperties();
  SpreadsheetApp.getUi().alert(
    APP.NAME + '\n' +
    'Ready: ' + props.getProperty('APP_READY') + '\n' +
    'Versao: ' + props.getProperty('APP_VERSION') + '\n' +
    'Setup: ' + props.getProperty('SETUP_DATE')
  );
}
