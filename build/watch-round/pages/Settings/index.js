let $style$1728483328 = {
  "@info": {
    "styleObjectId": 1728483328
  }
};
const $app_style$1728483328 = $style$1728483328;
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
const FONT_SIZES = ["15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const LINE_SPACINGS = ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"];
const TEXT_COLORS = ["warm", "white", "aqua", "yellow", "blue", "green"];
const $app_script$1728483328 = {
  data: function dataFun() {
    return {
      readerState: {},
      fontClass: "font-30",
      lineClass: "line-16",
      weightClass: "weight-normal",
      alignClass: "align-left",
      colorClass: "color-warm",
      fontSizeValue: "30",
      lineSpacingValue: "1.6",
      normalWeightMark: "●",
      boldWeightMark: "○",
      leftAlignMark: "●",
      centerAlignMark: "○",
      normalWeightClass: "option-active",
      boldWeightClass: "",
      leftAlignClass: "option-active",
      centerAlignClass: "",
      swatchClass: "swatch-warm",
      textColorValue: "暖白"
    };
  },
  onInit() {
    this.readerState = loadReaderState();
    this.refreshView();
  },
  cycleValue(values, currentValue, direction) {
    const currentIndex = Math.max(0, values.indexOf(currentValue));
    const nextIndex = Math.max(0, Math.min(values.length - 1, currentIndex + direction));
    return values[nextIndex];
  },
  persistSettings() {
    saveReaderState(this.readerState);
    this.refreshView();
  },
  refreshView() {
    const fontSize = this.readerState.fontSize || "30";
    const lineSpacing = this.readerState.lineSpacing || "16";
    const fontWeight = this.readerState.fontWeight || "normal";
    const textAlign = this.readerState.textAlign || "left";
    const textColor = this.readerState.textColor || "warm";
    this.fontClass = `font-${fontSize}`;
    this.lineClass = `line-${lineSpacing}`;
    this.weightClass = `weight-${fontWeight}`;
    this.alignClass = `align-${textAlign}`;
    this.colorClass = `color-${textColor}`;
    this.fontSizeValue = fontSize;
    this.lineSpacingValue = (Number(lineSpacing) / 10).toFixed(1);
    this.normalWeightMark = fontWeight === "normal" ? "●" : "○";
    this.boldWeightMark = fontWeight === "bold" ? "●" : "○";
    this.leftAlignMark = textAlign === "left" ? "●" : "○";
    this.centerAlignMark = textAlign === "center" ? "●" : "○";
    this.normalWeightClass = fontWeight === "normal" ? "option-active" : "";
    this.boldWeightClass = fontWeight === "bold" ? "option-active" : "";
    this.leftAlignClass = textAlign === "left" ? "option-active" : "";
    this.centerAlignClass = textAlign === "center" ? "option-active" : "";
    this.swatchClass = `swatch-${textColor}`;
    this.textColorValue = {
      warm: "暖白",
      white: "纯白",
      aqua: "青色",
      yellow: "淡黄",
      blue: "浅蓝",
      green: "柔绿"
    }[textColor];
  },
  previousFontSize() {
    this.readerState.fontSize = this.cycleValue(FONT_SIZES, this.readerState.fontSize, -1);
    this.persistSettings();
  },
  nextFontSize() {
    this.readerState.fontSize = this.cycleValue(FONT_SIZES, this.readerState.fontSize, 1);
    this.persistSettings();
  },
  previousLineSpacing() {
    this.readerState.lineSpacing = this.cycleValue(LINE_SPACINGS, this.readerState.lineSpacing, -1);
    this.persistSettings();
  },
  nextLineSpacing() {
    this.readerState.lineSpacing = this.cycleValue(LINE_SPACINGS, this.readerState.lineSpacing, 1);
    this.persistSettings();
  },
  useNormalWeight() {
    this.readerState.fontWeight = "normal";
    this.persistSettings();
  },
  useBoldWeight() {
    this.readerState.fontWeight = "bold";
    this.persistSettings();
  },
  useLeftAlign() {
    this.readerState.textAlign = "left";
    this.persistSettings();
  },
  useCenterAlign() {
    this.readerState.textAlign = "center";
    this.persistSettings();
  },
  previousTextColor() {
    this.readerState.textColor = this.cycleValue(TEXT_COLORS, this.readerState.textColor, -1);
    this.persistSettings();
  },
  nextTextColor() {
    this.readerState.textColor = this.cycleValue(TEXT_COLORS, this.readerState.textColor, 1);
    this.persistSettings();
  },
  goBack() {
    global.router.back();
  }
};
$app_define$("@app-component/index", [], function($app_require$2, $app_exports$, $app_module$) {
  $app_module$.exports = $app_script$1728483328.default || $app_script$1728483328;
  $app_module$.exports.style = $app_style$1728483328;
});
$app_bootstrap$("@app-component/index");
