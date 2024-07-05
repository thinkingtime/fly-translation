"use strict";

const platformInfo = {};

FTConfig.onReady(function () {
  if (chrome.tabs) {
    FTConfig.set("originalUserAgent", navigator.userAgent);
  }

  let userAgent;
  if (FTConfig.get("originalUserAgent")) {
    userAgent = FTConfig.get("originalUserAgent");
  } else {
    userAgent = navigator.userAgent;
  }

  platformInfo.isMobile = {
    Android: userAgent.match(/Android/i),
    BlackBerry: userAgent.match(/BlackBerry/i),
    iOS: userAgent.match(/iPhone|iPad|iPod/i),
    Opera: userAgent.match(/Opera Mini/i),
    Windows: userAgent.match(/IEMobile/i) || userAgent.match(/WPDesktop/i),
  };
  platformInfo.isMobile.any =
    platformInfo.isMobile.Android ||
    platformInfo.isMobile.BlackBerry ||
    platformInfo.isMobile.iOS ||
    platformInfo.isMobile.Opera ||
    platformInfo.isMobile.Windows;

  platformInfo.isDesktop = {
    any: !platformInfo.isMobile.any,
    Firefox: typeof browser !== "undefined",
  };

  platformInfo.isFirefox = typeof browser !== "undefined";
  platformInfo.isOpera = userAgent.match(/OPR/i);
});
