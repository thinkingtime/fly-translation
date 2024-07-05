"use strict";

function getTabHostName() {
  return new Promise((resolve) =>
    chrome.runtime.sendMessage({ action: "getTabHostName" }, (result) => {
      checkedLastError();
      resolve(result);
    })
  );
}

void (async function () {
  await FTConfig.onReady();
  if (
    !platformInfo.isMobile.any &&
    FTConfig.get("showMobilePopupOnDesktop") !== "yes"
  )
    return;

  const tabHostName = await getTabHostName();
  let tabLanguage = "und";
  let pageLanguageState = "original";

  // load html and icons
  const htmlText = await fetch(
    chrome.runtime.getURL("/contentScript/html/popupMobile.html")
  ).then((response) => response.text());
  const googleIcon = await fetch(
    chrome.runtime.getURL("/icons/google-translate-32.png")
  ).then((response) => response.blob());
  const yandexIcon = await fetch(
    chrome.runtime.getURL("/icons/yandex-translate-32.png")
  ).then((response) => response.blob());
  const bingIcon = await fetch(
    chrome.runtime.getURL("/icons/bing-translate-32.png")
  ).then((response) => response.blob());

  // Load i18n messages based on your language preference
  await FTI18n.updateUiMessages();

  // creates shadow root, root element and append to document
  const rootElement = document.createElement("div");
  rootElement.style.cssText = "all: initial";
  rootElement.classList.add("notranslate");

  const shadowRoot = rootElement.attachShadow({ mode: "closed" });
  shadowRoot.innerHTML = htmlText;

  // update css property --popup-height
  setInterval(() => {
    const popupElement = shadowRoot.getElementById("popup");
    const menuOptions = shadowRoot.getElementById("menu-options");
    menuOptions.style.setProperty(
      "--popup-height",
      `${popupElement.clientHeight}px`
    );
  }, 1000);

  // remove popup after 8 seconds of inactivity
  let lastInteraction = Date.now();
  let lastInteractionInterval = null;
  let serviceSelectorIsOpen = false;

  function showPopup() {
    lastInteraction = Date.now();
    clearInterval(lastInteractionInterval);

    const updatePadding = () => {
      if (FTConfig.get("addPaddingToPage") === "yes") {
        const popupElement = shadowRoot.getElementById("popup");
        let padding = popupElement.clientHeight + "px";

        const scrollTop = document.documentElement.scrollTop;
        
        document.documentElement.style.height = null;
        document.documentElement.style.paddingTop = null;
        document.documentElement.style.paddingBottom = null;

        document.documentElement.style.height =
          document.documentElement.scrollHeight + "px";
        if (FTConfig.get("popupMobilePosition") === "top") {
          document.documentElement.style.paddingTop = padding;
          document.documentElement.style.paddingBottom = null;
        } else {
          document.documentElement.style.paddingTop = null;
          document.documentElement.style.paddingBottom = padding;
        }

        document.documentElement.scrollTop = scrollTop;
      }
    };

    if (!rootElement.isConnected) {
      document.documentElement.appendChild(rootElement);
      updatePadding();

      lastInteractionInterval = setInterval(() => {
        updatePadding();

        const menuContainer = shadowRoot.getElementById("menu-container");
        if (
          Date.now() - lastInteraction > 1000 * 8 &&
          menuContainer.style.display !== "block" &&
          serviceSelectorIsOpen === false &&
          FTConfig.get("popupMobileKeepOnScren") === "no"
        ) {
          hidePopup();
        }
      }, 1000);

      updateInterface();
    }
  }

  function hidePopup(withoutAnimation = false) {
    clearInterval(lastInteractionInterval);
    if (rootElement.isConnected && !withoutAnimation) {
      const mainElement = shadowRoot.querySelector("main");
      const animation = mainElement.animate(
        [
          { transform: "translateY(0px)", opacity: "1" },
          {
            transform: `translateY(${
              FTConfig.get("popupMobilePosition") === "top" ? "-50px" : "50px"
            })`,
            opacity: "0",
          },
        ],
        {
          duration: 200,
          iterations: 1,
        }
      );
      animation.onfinish = () => {
        rootElement.remove();
      };
      setTimeout(() => {
        rootElement.remove();
        animation.onfinish = null;
      }, 300);
      const menuContainer = shadowRoot.getElementById("menu-container");
      menuContainer.style.display = "none";
    }

    if (withoutAnimation) {
      rootElement.remove();
    }

    if (FTConfig.get("addPaddingToPage") === "yes") {
      document.documentElement.style.height = null;
      document.documentElement.style.paddingTop = null;
      document.documentElement.style.paddingBottom = null;
    }
  }

  // set text direction
  if (
    FTLang.isRtlLanguage(
      FTConfig.get("uiLanguage") ||
        FTLang.fixUILanguageCode(chrome.i18n.getUILanguage())
    )
  ) {
    shadowRoot.querySelector("main").setAttribute("dir", "rtl");
  }

  // translate shadow root
  FTI18n.translateDocument(shadowRoot);

  // close popup
  const popupElement = shadowRoot.getElementById("popup");
  popupElement.ontouchstart = (e) => {
    if (e.target !== popupElement) return;
    lastInteraction = Date.now();

    e.stopImmediatePropagation();
    const startPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    popupElement.ontouchmove = (e) => {
      lastInteraction = Date.now();

      e.stopImmediatePropagation();
      const offset = e.touches[0].clientX - startPoint.x;
      popupElement.style.transform = `translateX(${offset}px)`;

      if (Math.abs(offset) > window.innerWidth * 0.2) {
        popupElement.ontouchmove = null;
        popupElement.ontouchend = null;
        popupElement.ontouchcancel = null;

        popupElement.style.transition = `transform 0.3s ease-in-out`;
        if (offset > 0) {
          popupElement.style.transform = `translateX(100%)`;
        } else {
          popupElement.style.transform = `translateX(-100%)`;
        }
        popupElement.ontransitionend = () => {
          hidePopup(true);
          popupElement.ontransitionend = null;
          popupElement.style.cssText = "";
        };
        setTimeout(() => {
          hidePopup(true);
          popupElement.ontransitionend = null;
          popupElement.style.cssText = "";
        }, 400);
      }
    };

    popupElement.ontouchend = (e) => {
      lastInteraction = Date.now();

      e.stopImmediatePropagation();
      popupElement.style.transform = `translateX(0px)`;
    };
    popupElement.ontouchcancel = (e) => {
      lastInteraction = Date.now();

      e.stopImmediatePropagation();
      popupElement.style.transform = `translateX(0px)`;
    };
  };

  // update service icon
  const serviceIconElement = /** @type {HTMLImageElement} */ (
    shadowRoot.getElementById("serviceIcon")
  );
  const updateServiceIcon = () => {
    const service = FTConfig.get("pageTranslatorService");
    if (service === "google") {
      serviceIconElement.src = URL.createObjectURL(googleIcon);
    } else if (service === "yandex") {
      serviceIconElement.src = URL.createObjectURL(yandexIcon);
    } else if (service === "bing") {
      serviceIconElement.src = URL.createObjectURL(bingIcon);
    }
    serviceIconElement.onload = () => {
      serviceIconElement.onload = null;
      URL.revokeObjectURL(serviceIconElement.src);
    };
  };
  updateServiceIcon();

  // select translation service
  const serviceSelector = /** @type {HTMLSelectElement} */ (
    shadowRoot.getElementById("serviceSelector")
  );
  serviceSelector.onclick = () => {
    serviceSelectorIsOpen = true;
    lastInteraction = Date.now();

    serviceIconElement.style.scale = "1.5";
    serviceIconElement.style.rotate = "180deg";
  };
  serviceSelector.onchange = () => {
    serviceSelectorIsOpen = false;
    lastInteraction = Date.now();

    const service = serviceSelector.value;
    FTConfig.set("pageTranslatorService", service);
    updateServiceIcon();

    serviceIconElement.style.scale = null;
    serviceIconElement.style.rotate = null;

    pageTranslator.swapTranslationService(service);
  };
  serviceSelector.onblur = () => {
    serviceSelectorIsOpen = false;
    lastInteraction = Date.now();

    serviceIconElement.style.scale = null;
    serviceIconElement.style.rotate = null;
  };
  serviceSelector.value = FTConfig.get("pageTranslatorService");

  // gear button
  const gearButton = shadowRoot.getElementById("gear");
  gearButton.onclick = () => {
    lastInteraction = Date.now();

    gearButton.classList.add("rotate");
    const menuContainer = shadowRoot.getElementById("menu-container");
    menuContainer.style.display = "block";

    const menuBg = shadowRoot.getElementById("menu-bg");
    menuBg.onclick = (e) => {
      lastInteraction = Date.now();

      e.stopImmediatePropagation();
      closeMenu();
    };

    const menuOptions = shadowRoot.getElementById("menu-options");
    menuOptions.onclick = (e) => {
      lastInteraction = Date.now();

      const target = /** @type {HTMLElement} */ (e.target);
      e.stopImmediatePropagation();
      onMenuOptionClick(target.dataset.value);
    };
  };

  // close menu
  function closeMenu() {
    const gearButton = shadowRoot.getElementById("gear");
    const menuContainer = shadowRoot.getElementById("menu-container");

    gearButton.classList.remove("rotate");
    menuContainer.style.animation = "expand 0.3s ease-out reverse";
    menuContainer.onanimationend = () => {
      menuContainer.onanimationend = null;
      menuContainer.style.display = "none";
      menuContainer.style.animation = null;
    };
  }

  // menu options
  /**
   * @param {string} action
   * @returns
   */
  function onMenuOptionClick(action) {
    if (!action) return;

    if (action === "choose-another-language") {
      return;
    } else if (action === "always-translate-from") {
      tabLanguage = FTLang.fixTLanguageCode(tabLanguage);
      if (FTConfig.get("alwaysTranslateLangs").indexOf(tabLanguage) === -1) {
        FTConfig.addLangToAlwaysTranslate(tabLanguage);
        pageTranslator.translatePage();
      } else {
        FTConfig.removeLangFromAlwaysTranslate(tabLanguage);
      }
    } else if (action === "never-translate-from") {
      tabLanguage = FTLang.fixTLanguageCode(tabLanguage);
      if (FTConfig.get("neverTranslateLangs").indexOf(tabLanguage) === -1) {
        FTConfig.addLangToNeverTranslate(tabLanguage);
        pageTranslator.restorePage();
      } else {
        FTConfig.removeLangFromNeverTranslate(tabLanguage);
      }
    } else if (action === "never-translate-this-site") {
      if (FTConfig.get("neverTranslateSites").indexOf(tabHostName) === -1) {
        FTConfig.addSiteToNeverTranslate(tabHostName);
        pageTranslator.restorePage();
      } else {
        FTConfig.removeSiteFromNeverTranslate(tabHostName);
      }
    } else if (action === "show-translate-selected-button") {
      FTConfig.set(
        "showTranslateSelectedButton",
        FTConfig.get("showTranslateSelectedButton") === "yes" ? "no" : "yes"
      );
    } else if (action === "more-options") {
      const generateRandomHash = (length) => {
        const characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let hash = "";
        for (let i = 0; i < length; i++) {
          hash += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return hash;
      };
      const authorizationToOpenOptions = generateRandomHash(32);
      chrome.runtime.sendMessage({
        action: "authorizationToOpenOptions",
        authorizationToOpenOptions,
      });
      window.open(
        chrome.runtime.getURL("/options/open-options.html") +
          `#!authorizationToOpenOptions=${authorizationToOpenOptions}`,
        "blank"
      );
    } else if (action === "keep-on-screen") {
      FTConfig.set(
        "popupMobileKeepOnScren",
        FTConfig.get("popupMobileKeepOnScren") === "yes" ? "no" : "yes"
      );
    } else if (action === "change-position") {
      FTConfig.set(
        "popupMobilePosition",
        FTConfig.get("popupMobilePosition") === "top" ? "bottom" : "top"
      );
    }

    closeMenu();

    updateInterface();
  }

  // update interface
  function updateInterface() {
    // update the question text
    const questionElement = shadowRoot.getElementById("question");
    const btnTranslate = shadowRoot.getElementById("btnTranslate");
    if (pageLanguageState === "original") {
      questionElement.textContent = FTI18n.getMessage("msgTranslatePage");
      btnTranslate.textContent = FTI18n.getMessage("btnTranslate");
    } else {
      questionElement.textContent = FTI18n.getMessage("msgPageTranslated");
      btnTranslate.textContent = FTI18n.getMessage("btnUndoTranslation");
    }

    // update show-translate-selected-button checkicon
    if (FTConfig.get("showTranslateSelectedButton") === "yes") {
      shadowRoot.querySelector(
        `#menu-options [data-value="show-translate-selected-button"] [checkicon]`
      ).textContent = "✔";
    } else {
      shadowRoot.querySelector(
        `#menu-options [data-value="show-translate-selected-button"] [checkicon]`
      ).textContent = "";
    }

    // update never-translate-this-site checkicon
    if (FTConfig.get("neverTranslateSites").indexOf(tabHostName) !== -1) {
      shadowRoot.querySelector(
        `#menu-options [data-value="never-translate-this-site"] [checkicon]`
      ).textContent = "✔";
    } else {
      shadowRoot.querySelector(
        `#menu-options [data-value="never-translate-this-site"] [checkicon]`
      ).textContent = "";
    }

    tabLanguage = FTLang.fixTLanguageCode(tabLanguage) || "und";

    // update from-to text when original tab is detected
    const from_to_element = shadowRoot.getElementById("from-to");
    from_to_element.textContent = FTI18n.getMessage("msgTranslateFromTo", [
      FTLang.codeToLanguage(tabLanguage),
      FTLang.codeToLanguage(FTConfig.get("targetLanguage")),
    ]);

    // show or hide always-translate-from and never-translate-from
    if (
      tabLanguage === "und" ||
      tabLanguage == FTConfig.get("targetLanguage")
    ) {
      shadowRoot.querySelector(
        `#menu-options [data-value="always-translate-from"]`
      ).style.display = "none";
      shadowRoot.querySelector(
        `#menu-options [data-value="never-translate-from"]`
      ).style.display = "none";
    } else {
      shadowRoot.querySelector(
        `#menu-options [data-value="always-translate-from"]`
      ).style.display = "flex";
      shadowRoot.querySelector(
        `#menu-options [data-value="never-translate-from"]`
      ).style.display = "flex";
    }

    // update always-translate-from text
    shadowRoot.querySelector(
      `#menu-options [data-value="always-translate-from"] [data-i18n]`
    ).textContent = FTI18n.getMessage("lblAlwaysTranslate", [
      FTLang.codeToLanguage(tabLanguage),
    ]);

    // update always-translate-from checkicon
    if (FTConfig.get("alwaysTranslateLangs").indexOf(tabLanguage) !== -1) {
      shadowRoot.querySelector(
        `#menu-options [data-value="always-translate-from"] [checkicon]`
      ).textContent = "✔";
    } else {
      shadowRoot.querySelector(
        `#menu-options [data-value="always-translate-from"] [checkicon]`
      ).textContent = "";
    }

    // update never-translate-from checkicon
    if (FTConfig.get("neverTranslateLangs").indexOf(tabLanguage) !== -1) {
      shadowRoot.querySelector(
        `#menu-options [data-value="never-translate-from"] [checkicon]`
      ).textContent = "✔";
    } else {
      shadowRoot.querySelector(
        `#menu-options [data-value="never-translate-from"] [checkicon]`
      ).textContent = "";
    }

    // update keep-on-screen checkicon
    if (FTConfig.get("popupMobileKeepOnScren") === "yes") {
      shadowRoot.querySelector(
        `#menu-options [data-value="keep-on-screen"] [checkicon]`
      ).textContent = "✔";
    } else {
      shadowRoot.querySelector(
        `#menu-options [data-value="keep-on-screen"] [checkicon]`
      ).textContent = "";
    }

    // update change-position
    if (FTConfig.get("popupMobilePosition") === "top") {
      const bottomStyle = shadowRoot.getElementById("bottom-style");
      if (bottomStyle) bottomStyle.remove();
    } else {
      const bottomStyle = shadowRoot.getElementById("bottom-style");
      if (!bottomStyle) {
        const bottomStyle = document.createElement("style");
        bottomStyle.id = "bottom-style";
        bottomStyle.textContent = `
          main {
            top: unset;
            bottom: 0;
            display: flex;
            flex-direction: column-reverse;
          }

          #menu-options {
            top: 5px;
            box-shadow: 0 -3px 6px 0 var(--shadow-color);
          }

          @keyframes popup {
            0% {
                opacity: 0;
                transform: translateY(50px);
            }
    
            100% {
                opacity: 1;
                transform: translateY(0);
            }
          }

          @keyframes expand {
            0% {
                opacity: 0;
                scale: 0 0;
                translate: 50% 50%;
            }
    
            100% {
                opacity: 1;
                scale: 1 1;
                translate: 0 0;
            }
          }
        `;
        shadowRoot.appendChild(bottomStyle);
      }
    }
  }
  updateInterface();

  pageTranslator.onPageLanguageStateChange((_pageLanguageState) => {
    pageLanguageState = _pageLanguageState;
    updateInterface();
  });

  // translate or restore page
  const btnTranslate = shadowRoot.getElementById("btnTranslate");
  btnTranslate.onclick = () => {
    lastInteraction = Date.now();

    if (pageLanguageState === "original") {
      pageTranslator.translatePage();
    } else {
      pageTranslator.restorePage();
    }
  };

  // fill language list
  (function () {
    let langs = FTLang.getLanguageList();

    const langsSorted = [];

    for (const i in langs) {
      langsSorted.push([i, langs[i]]);
    }

    langsSorted.sort(function (a, b) {
      return a[1].localeCompare(b[1]);
    });

    const menuSelectLanguage = /** @type {HTMLSelectElement} */ (
      shadowRoot.getElementById("language-selector")
    );

    const eAllLangs = menuSelectLanguage.querySelector('[name="all"]');
    langsSorted.forEach((value) => {
      const option = document.createElement("option");
      option.value = value[0];
      option.textContent = value[1];
      eAllLangs.appendChild(option);
    });

    const eRecentsLangs = menuSelectLanguage.querySelector('[name="targets"]');

    const buildRecentsLanguages = () => {
      eRecentsLangs.innerHTML = "";
      for (const value of FTConfig.get("targetLanguages")) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = langs[value];
        eRecentsLangs.appendChild(option);
      }
      menuSelectLanguage.value = FTConfig.get("targetLanguages")[0];
    };
    buildRecentsLanguages();

    menuSelectLanguage.oninput = () => {
      FTConfig.setTargetLanguage(menuSelectLanguage.value, true);
      pageTranslator.translatePage(menuSelectLanguage.value);
      buildRecentsLanguages();
      updateInterface();

      closeMenu();
    };
  })();

  // show/hide popup on 3 finger tap
  window.addEventListener("touchstart", (e) => {
    if (e.touches.length == 3) {
      if (rootElement.isConnected) {
        hidePopup();
      } else {
        showPopup();
      }
    }
  });

  // show popup when clicked on the extension icon on the extension manager
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showPopupMobile") {
      showPopup();
    }
  });

  pageTranslator.onGetOriginalTabLanguage(function (_tabLanguage) {
    tabLanguage = _tabLanguage || "und";
    if (tabLanguage !== "und") {
      tabLanguage = FTLang.fixTLanguageCode(tabLanguage);
    }
    if (
      FTConfig.get("whenShowMobilePopup") !== "only-when-i-touch" &&
      tabLanguage !== "und" &&
      FTConfig.get("neverTranslateLangs").indexOf(tabLanguage) === -1 &&
      FTConfig.get("neverTranslateSites").indexOf(tabHostName) === -1 &&
      FTConfig.get("targetLanguage") !== tabLanguage
    ) {
      showPopup();
    } else if (FTConfig.get("whenShowMobilePopup") === "always-show") {
      showPopup();
    }
  });

  // dark/light mode
  function updateTheme() {
    let darkMode = false;
    if (FTConfig.get("darkMode") === "auto") {
      darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? true
        : false;
    } else {
      darkMode = FTConfig.get("darkMode") === "yes" ? true : false;
    }

    if (darkMode) {
      const lightModeElement = shadowRoot.getElementById("light-mode");
      if (lightModeElement) lightModeElement.remove();
    } else {
      let lightModeElement = shadowRoot.getElementById("light-mode");
      if (!lightModeElement) {
        lightModeElement = document.createElement("style");
        lightModeElement.id = "light-mode";
        lightModeElement.textContent = `
          * {
            --primary-text-color: rgb(36, 34, 34);
            --secondary-text-color: rgb(68, 67, 67);
            --background-color: rgb(238, 236, 236);
            --shadow-color: rgb(115, 148, 211);
            --translate-button-text-color: rgb(91, 153, 247);
            --hover-color: rgb(67, 78, 95);
          }
        `;
        shadowRoot.appendChild(lightModeElement);
      }
    }
  }
  updateTheme();

  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    updateTheme();
  });

  FTConfig.onChanged((name, newValue) => {
    if (name == "darkMode") {
      updateTheme();
    }
  });
})();
