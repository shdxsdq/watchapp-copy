// 必须替换为配套手机应用的真实信息后，才能建立 BlueXlink 连接。
// 这两个值不能猜测：package 来自手机应用，fingerprint 来自其签名证书。
const PHONE_APP_PACKAGE = ''
const PHONE_APP_FINGERPRINT = ''

function hasPhoneAppConfiguration() {
  return PHONE_APP_PACKAGE.length > 0 && PHONE_APP_FINGERPRINT.length > 0
}

export {
  PHONE_APP_PACKAGE,
  PHONE_APP_FINGERPRINT,
  hasPhoneAppConfiguration
}
