let $style$1411120752 = {
  "@info": {
    "styleObjectId": 1411120752
  }
};
const $app_style$1411120752 = $style$1411120752;
const router = $app_require$("@app-module/system.router");
const storage$1 = $app_require$("@app-module/system.storage");
global.router = router;
global.storage = storage$1;
const PHONE_APP_PACKAGE = "";
const PHONE_APP_FINGERPRINT = "";
function hasPhoneAppConfiguration() {
  return PHONE_APP_PACKAGE.length > 0 && PHONE_APP_FINGERPRINT.length > 0;
}
const storage = $app_require$("@app-module/system.storage");
const STATE_KEY = "watchreader.state.v1";
const CONTENT_VERSION = 2;
function createDefaultState() {
  return {
    favorites: {},
    progress: {},
    scrollProgress: {},
    contentVersion: CONTENT_VERSION,
    deletedArticles: {},
    importedArticle: null,
    fontSize: "30",
    lineSpacing: "16",
    fontWeight: "normal",
    textAlign: "left",
    textColor: "warm"
  };
}
function loadReaderState() {
  const defaultState = createDefaultState();
  try {
    const savedValue = storage.getSync({
      key: STATE_KEY
    });
    if (typeof savedValue !== "string" || savedValue.length === 0) {
      return defaultState;
    }
    const savedState = JSON.parse(savedValue);
    const fontSizeMap = {
      small: "26",
      medium: "30",
      large: "36"
    };
    const lineSpacingMap = {
      compact: "14",
      normal: "16",
      relaxed: "18"
    };
    return {
      favorites: savedState.favorites || {},
      progress: savedState.contentVersion === CONTENT_VERSION ? savedState.progress || {} : {},
      contentVersion: CONTENT_VERSION,
      scrollProgress: savedState.contentVersion === CONTENT_VERSION ? savedState.scrollProgress || {} : {},
      deletedArticles: savedState.deletedArticles || {},
      importedArticle: savedState.importedArticle || null,
      fontSize: fontSizeMap[savedState.fontSize] || savedState.fontSize || "30",
      lineSpacing: lineSpacingMap[savedState.lineSpacing] || savedState.lineSpacing || "16",
      fontWeight: savedState.fontWeight || "normal",
      textAlign: savedState.textAlign || "left",
      textColor: savedState.textColor || "warm"
    };
  } catch (error) {
    console.warn("读取阅读状态失败，将使用默认状态", error);
    return defaultState;
  }
}
function saveReaderState(state) {
  storage.set({
    key: STATE_KEY,
    value: JSON.stringify(state),
    fail(data, code) {
      console.warn("保存阅读状态失败", data, code);
    }
  });
}
const interconnect = $app_require$("@app-module/system.interconnect");
const file = $app_require$("@app-module/system.file");
const IMPORTED_ARTICLE_ID = "imported-txt";
const IMPORTED_FILE_URI = "internal://files/watchreader-imported.txt";
let connection = null;
const importListeners = [];
function isTxtFile(fileName) {
  return typeof fileName === "string" && /\.txt$/i.test(fileName);
}
function titleFromFileName(fileName) {
  const cleanName = String(fileName || "导入的文章").replace(/\.txt$/i, "");
  return cleanName.length > 28 ? cleanName.slice(0, 28) : cleanName;
}
function notifyImport(metadata) {
  for (let index = 0; index < importListeners.length; index += 1) {
    importListeners[index](metadata);
  }
}
function saveImportedMetadata(fileName, uri) {
  const state = loadReaderState();
  const metadata = {
    id: IMPORTED_ARTICLE_ID,
    title: titleFromFileName(fileName),
    summary: "从手机传入的离线 TXT 文档",
    readTime: "离线文本",
    fileName,
    fileUri: uri,
    importedAt: Date.now()
  };
  state.importedArticle = metadata;
  state.progress[IMPORTED_ARTICLE_ID] = 0;
  delete state.scrollProgress[IMPORTED_ARTICLE_ID];
  state.favorites[IMPORTED_ARTICLE_ID] = false;
  saveReaderState(state);
  notifyImport(metadata);
}
function acceptIncomingFile(message) {
  if (!message || !message.isFileType || !isTxtFile(message.fileName)) {
    return;
  }
  const copyIncomingFile = () => file.copy({
    srcUri: message.fileUri,
    dstUri: IMPORTED_FILE_URI,
    success(uri) {
      saveImportedMetadata(message.fileName, uri || IMPORTED_FILE_URI);
    },
    fail(data, code) {
      console.warn("保存传入的 TXT 失败", data, code);
    }
  });
  file.access({
    uri: IMPORTED_FILE_URI,
    success() {
      file.delete({
        uri: IMPORTED_FILE_URI,
        complete: copyIncomingFile
      });
    },
    fail: copyIncomingFile
  });
}
function startTxtReceiver() {
  if (connection) {
    return true;
  }
  if (!hasPhoneAppConfiguration()) {
    return false;
  }
  connection = interconnect.instance({
    package: PHONE_APP_PACKAGE,
    fingerprint: PHONE_APP_FINGERPRINT
  });
  connection.onOpen = () => {
  };
  connection.onClose = () => {
  };
  connection.onError = (data, code) => {
    console.warn("BlueXlink 连接失败", data, code);
  };
  connection.onMessage = acceptIncomingFile;
  return true;
}
const $app_script$1411120752 = {
  onCreate() {
    startTxtReceiver();
  }
};
$app_define$("@app-component/app", [], function($app_require$2, $app_exports$, $app_module$) {
  $app_module$.exports = $app_script$1411120752.default || $app_script$1411120752;
  $app_module$.exports.style = $app_style$1411120752;
});
$app_bootstrap$("@app-application/app");
