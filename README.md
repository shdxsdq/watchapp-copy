# 腕上阅读

适配 BlueOS 手表的纯离线长文本阅读应用。

## 已实现

- 本地文章书架
- 长文本上下滑动阅读
- 阅读页点击左半屏向上翻、右半屏向下翻，每次接近一屏并保留约两行重叠；仍可滑动和使用表冠
- 保存滚动位置，并兼容旧版本的段落阅读进度
- 阅读页保留小、中、大三个快捷字号
- 独立阅读设置页：22–40 十档字号、1.2–2.0 九档行距、粗细、对齐和六种文字颜色
- BlueXlink TXT 接收端：校验 `.txt`、复制到本地文件区并加入书架
- 每篇文章独立保存阅读进度
- 收藏与取消收藏
- 全部正文随应用打包，不发起网络请求

## 项目结构

```text
src/
├── app.ux                    # 应用入口
├── global.js                 # 官方路由与存储能力
├── manifest.json             # BlueOS 应用清单
├── data/articles.js          # 离线文章内容
├── config/blueXlink.js       # 手机应用包名与证书指纹配置
├── utils/readerStorage.js    # 收藏、阅读设置与进度存储
├── utils/txtLibrary.js       # TXT 接收、保存、分段与读取
├── assets/styles/            # 全局样式变量
└── pages/
    ├── Home/index.ux         # 文章列表
    ├── Reader/index.ux       # 阅读页面
    └── Settings/index.ux     # 阅读设置页面
```

## TXT 传书说明

手表端接收链路已经实现：BlueXlink 收到 `.txt` 后，将文件复制到 `internal://files/watchreader-imported.txt`，保存文件信息，并在首页显示为“最近传入的 TXT”。再次传书会替换上一份导入文件。

完整传书仍需 vivo 官方“智能终端设备手机侧 SDK”、一个手机配套应用，以及该应用真实的包名和证书指纹。取得这些信息后，填写 `src/config/blueXlink.js` 即可启用手表端连接；项目不会使用虚构参数建立连接。

## 在 BlueOS Studio 中运行

1. 使用 BlueOS Studio 打开本项目根目录。
2. 等待 Studio 自动完成依赖检查和编译。
3. 在右侧预览器选择 `watch-square`，分辨率选择 `390 × 450`。
4. 若预览没有自动刷新，点击预览区域工具栏中的重新编译按钮。

项目使用 BlueOS Studio 官方模板和随 Studio 安装的 SDK，不依赖网络服务。

## 自己添加 TXT

1. 将 UTF-8 编码的 `.txt` 文件复制到项目根目录的 `local-texts` 文件夹。
2. TXT 文件名会自动作为手表书架中的书名。
3. 双击项目根目录的 `一键更新书架并打包.cmd`。
4. 等待窗口显示“完成”，新的 RPK 位于 `dist\watch-square\debug`。

每次运行脚本都会自动更新本地书架、递增应用版本并调用 BlueOS Studio 官方编译器打包。仅复制文件但不运行脚本时，TXT 不会进入 RPK。
