let $style$779992388 = {
  "@info": {
    "styleObjectId": 779992388
  }
};
const $app_style$779992388 = $style$779992388;
const storage = $app_require$("@app-module/system.storage");
const STATE_KEY = "watchreader.state.v1";
const CONTENT_VERSION = 2;
let cachedState = null;
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
  if (cachedState) {
    return cachedState;
  }
  const defaultState = createDefaultState();
  try {
    const savedValue = storage.getSync({
      key: STATE_KEY
    });
    if (typeof savedValue !== "string" || savedValue.length === 0) {
      cachedState = defaultState;
      return cachedState;
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
    cachedState = {
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
    return cachedState;
  } catch (error) {
    console.warn("读取阅读状态失败，将使用默认状态", error);
    cachedState = defaultState;
    return cachedState;
  }
}
function saveReaderState(state) {
  cachedState = state;
  storage.set({
    key: STATE_KEY,
    value: JSON.stringify(state),
    fail(data, code) {
      console.warn("保存阅读状态失败", data, code);
    }
  });
}
const PHONE_APP_PACKAGE = "";
const PHONE_APP_FINGERPRINT = "";
function hasPhoneAppConfiguration() {
  return PHONE_APP_PACKAGE.length > 0 && PHONE_APP_FINGERPRINT.length > 0;
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
function subscribeTxtImport(listener) {
  if (typeof listener === "function") {
    importListeners.push(listener);
  }
}
function deleteImportedArticle(callbacks) {
  const state = loadReaderState();
  const metadata = state.importedArticle;
  const clearMetadata = () => {
    state.importedArticle = null;
    delete state.progress[IMPORTED_ARTICLE_ID];
    delete state.scrollProgress[IMPORTED_ARTICLE_ID];
    delete state.favorites[IMPORTED_ARTICLE_ID];
    saveReaderState(state);
    if (callbacks && callbacks.success) {
      callbacks.success();
    }
  };
  if (!metadata || !metadata.fileUri) {
    clearMetadata();
    return;
  }
  file.delete({
    uri: metadata.fileUri,
    success: clearMetadata,
    fail(data, code) {
      console.warn("删除导入的 TXT 失败", data, code);
      if (callbacks && callbacks.fail) {
        callbacks.fail(data, code);
      }
    }
  });
}
const LOCAL_BOOKS = [{
  "id": "local-58771f595f",
  "title": "玻璃森林的夏天"
}, {
  "id": "local-19a4f582b8",
  "title": "倒着走的钟"
}, {
  "id": "local-d660d980d9",
  "title": "第七码头"
}, {
  "id": "local-2229f991e7",
  "title": "雾港来信"
}, {
  "id": "local-019e219b5e",
  "title": "月亮修理铺"
}, {
  "id": "local-c3d660c3fe",
  "title": "云上邮局"
}];
const $app_script$779992388 = {
  data: function dataFun() {
    return {
      importedAvailable: false,
      importedTitle: "TXT 传书",
      localBooks: [],
      localDeleteTarget: "",
      importedDeleteVisible: false,
      importedCardClass: ""
    };
  },
  onInit() {
    startTxtReceiver();
    subscribeTxtImport(() => {
      this.refreshReadingState();
    });
    this.refreshReadingState();
  },
  onShow() {
    this.refreshReadingState();
  },
  refreshReadingState() {
    const state = loadReaderState();
    this.applyImportedArticle(state);
    const deleted = state.deletedArticles || {};
    this.localBooks = LOCAL_BOOKS.filter((book) => !deleted[book.id]);
  },
  applyImportedArticle(state) {
    const importedArticle = state.importedArticle;
    this.importedAvailable = Boolean(importedArticle);
    this.importedTitle = importedArticle ? importedArticle.title : "TXT 传书";
  },
  openArticle(articleId) {
    global.router.push({
      uri: "/pages/Reader",
      params: {
        articleId
      }
    });
  },
  resetSwipeState() {
    this.importedDeleteVisible = false;
    this.localDeleteTarget = "";
    this.importedCardClass = "";
  },
  showDelete(articleId) {
    this.resetSwipeState();
    if (articleId === IMPORTED_ARTICLE_ID) {
      this.importedDeleteVisible = true;
      this.importedCardClass = "article-card-swiped";
    }
  },
  showLocalDelete(articleId) {
    this.resetSwipeState();
    this.localDeleteTarget = articleId;
  },
  handleSwipe(event, articleId) {
    const direction = event && event.direction;
    if (direction === "left") {
      this.showDelete(articleId);
    } else if (direction === "right") {
      this.resetSwipeState();
    }
  },
  swipeImportedTxt(event) {
    this.handleSwipe(event, IMPORTED_ARTICLE_ID);
  },
  swipeLocalBook(articleId, event) {
    const direction = event && event.direction;
    if (direction === "left") {
      this.resetSwipeState();
      this.localDeleteTarget = articleId;
    } else if (direction === "right") {
      this.localDeleteTarget = "";
    }
  },
  deleteBundledArticle(articleId) {
    const state = loadReaderState();
    state.deletedArticles[articleId] = true;
    delete state.progress[articleId];
    delete state.scrollProgress[articleId];
    delete state.favorites[articleId];
    saveReaderState(state);
    this.resetSwipeState();
    this.refreshReadingState();
  },
  deleteImportedTxt() {
    deleteImportedArticle({
      success: () => {
        this.resetSwipeState();
        this.refreshReadingState();
      }
    });
  },
  deleteLocalBook(articleId) {
    this.deleteBundledArticle(articleId);
  },
  openLocalBook(articleId) {
    if (this.localDeleteTarget === articleId) {
      this.localDeleteTarget = "";
      return;
    }
    this.openArticle(articleId);
  },
  openImportedTxt() {
    if (this.importedDeleteVisible) {
      this.resetSwipeState();
      return;
    }
    this.openArticle(IMPORTED_ARTICLE_ID);
  },
  openTransfer() {
    global.router.push({
      uri: "/pages/Transfer"
    });
  },
  openSettings() {
    global.router.push({
      uri: "/pages/Settings"
    });
  }
};
$app_define$("@app-component/index", [], function($app_require$2, $app_exports$, $app_module$) {
  $app_module$.exports = $app_script$779992388.default || $app_script$779992388;
  $app_module$.exports.style = $app_style$779992388;
});
$app_bootstrap$("@app-component/index");
//# debugId=013893ae-8061-467b-9473-a202b50c2734
//# sourceMappingURL=index.js.map
