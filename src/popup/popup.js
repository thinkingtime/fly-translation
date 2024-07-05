"use strict";

var $ = document.querySelector.bind(document);

FTConfig
  .onReady()
  .then(() => FTI18n.updateUiMessages())
  .then(() => {
    FTI18n.translateDocument();
    const popupSectionCount = 6;

    $("#btnImproveTranslation").onclick = () => {
      window.location = "improve-translation.html";
    };

    let popupPanelSection = FTConfig.get("popupPanelSection");

    function updatePopupSection() {
      document.querySelectorAll("[data-popupPanelSection]").forEach((node) => {
        const nodePopupPanelSection = parseInt(
          node.getAttribute("data-popupPanelSection")
        );
        if (isNaN(nodePopupPanelSection)) return;

        if (nodePopupPanelSection > popupPanelSection) {
          node.style.display = "none";
        } else {
          node.style.display = "block";
        }
      });

      document.querySelectorAll("[data-popupPanelSection2]").forEach((node) => {
        const nodePopupPanelSection2 = parseInt(
          node.getAttribute("data-popupPanelSection2")
        );
        if (isNaN(nodePopupPanelSection2)) return;

        if (nodePopupPanelSection2 <= popupPanelSection) {
          node.style.display = "none";
        } else {
          node.style.display = "block";
        }
      });

      $("#more").style.display = "block";
      $("#less").style.display = "block";

      if (popupPanelSection >= popupSectionCount) {
        $("#more").style.display = "none";
      } else if (popupPanelSection <= 0) {
        $("#less").style.display = "none";
      }
    }
    updatePopupSection();

    $("#more").onclick = (e) => {
      if (popupPanelSection < popupSectionCount) {
        popupPanelSection++;
        updatePopupSection();
      }
      FTConfig.set("popupPanelSection", popupPanelSection);
    };
    $("#less").onclick = (e) => {
      if (popupPanelSection > 0) {
        popupPanelSection--;
        updatePopupSection();
      }
      FTConfig.set("popupPanelSection", popupPanelSection);
    };

    let originalTabLanguage = "und";
    let currentPageLanguage = "und";
    let currentPageLanguageState = "original";
    let currentPageTranslatorService = FTConfig.get("pageTranslatorService");

    function translateOrRestorePagePage(newTargetLanguage) {
      const _translateOrRestorePagePage = (newTargetLanguage) => {
        currentPageLanguage = newTargetLanguage;
        if (currentPageLanguage === "original") {
          currentPageLanguageState = "original";
        } else {
          currentPageLanguageState = "translated";
          FTConfig.setTargetLanguage(newTargetLanguage);
        }

        chrome.tabs.query(
          {
            active: true,
            currentWindow: true,
          },
          (tabs) => {
            if (FTConfig.get("enableIframePageTranslation") === "yes") {
              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  action: "translatePage",
                  targetLanguage: newTargetLanguage || "original",
                },
                checkedLastError
              );
            } else {
              chrome.tabs.sendMessage(
                tabs[0].id,
                {
                  action: "translatePage",
                  targetLanguage: newTargetLanguage || "original",
                },
                { frameId: 0 },
                checkedLastError
              );
            }
          }
        );

        updateInterface();
      };

      if (newTargetLanguage) {
        _translateOrRestorePagePage(newTargetLanguage);
      } else {
        chrome.tabs.query(
          {
            active: true,
            currentWindow: true,
          },
          (tabs) => {
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                action: "currentTargetLanguage",
              },
              {
                frameId: 0,
              },
              (pageLanguage) => {
                checkedLastError();
                if (pageLanguage) {
                  _translateOrRestorePagePage(pageLanguage);
                }
              }
            );
          }
        );
      }
    }

    const FTButtons = document.querySelectorAll("button");

    FTButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const newTargetLanguage = event.target.value;
        translateOrRestorePagePage(newTargetLanguage);
      });
    });

    let targetLanguages = FTConfig.get("targetLanguages");
    for (let i = 1; i < 4; i++) {
      const button = FTButtons[i];
      button.value = targetLanguages[i - 1];
      button.textContent = FTLang.codeToLanguage(targetLanguages[i - 1]);
    }

    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "getOriginalTabLanguage",
          },
          {
            frameId: 0,
          },
          (tabLanguage) => {
            checkedLastError();
            if (
              !tabLanguage ||
              (tabLanguage = FTLang.fixTLanguageCode(tabLanguage))
            ) {
              originalTabLanguage = tabLanguage || "und";
              FTButtons[0].childNodes[1].textContent =
                FTLang.codeToLanguage(originalTabLanguage);
            }
          }
        );

        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "getCurrentPageLanguage",
          },
          {
            frameId: 0,
          },
          (pageLanguage) => {
            checkedLastError();
            if (pageLanguage) {
              currentPageLanguage = pageLanguage;
              updateInterface();
            }
          }
        );

        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "getCurrentPageLanguageState",
          },
          {
            frameId: 0,
          },
          (pageLanguageState) => {
            checkedLastError();
            if (pageLanguageState) {
              currentPageLanguageState = pageLanguageState;
              updateInterface();
            }
          }
        );

        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "getCurrentPageTranslatorService",
          },
          {
            frameId: 0,
          },
          (pageTranslatorService) => {
            checkedLastError();
            if (pageTranslatorService) {
              currentPageTranslatorService = pageTranslatorService;
              updateInterface();
            }
          }
        );
      }
    );

    function updateInterface() {
      if (currentPageTranslatorService == "yandex") {
        $("#btnOptions option[value='translateInExternalSite']").textContent =
          FTI18n.getMessage("msgOpenOnYandexTranslator");
        $("#iconTranslate").setAttribute(
          "src",
          "/icons/yandex-translate-32.png"
        );
      } else if (currentPageTranslatorService == "bing") {
        $("#btnOptions option[value='translateInExternalSite']").textContent =
          FTI18n.getMessage("btnOpenOnGoogleTranslate");
        $("#iconTranslate").setAttribute("src", "/icons/bing-translate-32.png");
      } else {
        // google
        $("#btnOptions option[value='translateInExternalSite']").textContent =
          FTI18n.getMessage("btnOpenOnGoogleTranslate");
        $("#iconTranslate").setAttribute(
          "src",
          "/icons/google-translate-32.png"
        );
      }

      FTButtons.forEach((button) => {
        button.classList.remove("w3-buttonSelected");
        if (
          (currentPageLanguageState !== "translated" &&
            button.value === "original") ||
          (currentPageLanguageState === "translated" &&
            button.value === currentPageLanguage)
        ) {
          button.classList.add("w3-buttonSelected");
        }
      });

      if (originalTabLanguage !== "und") {
        $("#cbAlwaysTranslateThisLang").checked =
          FTConfig.get("alwaysTranslateLangs").indexOf(originalTabLanguage) !==
          -1;
        $("#lblAlwaysTranslateThisLang").textContent = FTI18n.getMessage(
          "lblAlwaysTranslate",
          FTLang.codeToLanguage(originalTabLanguage)
        );
        $("#cbAlwaysTranslateThisLang").removeAttribute("disabled");

        const translatedWhenHoveringThisLangText = FTI18n.getMessage(
          "lblShowTranslatedWhenHoveringThisLang",
          FTLang.codeToLanguage(originalTabLanguage)
        );
        $("#cbShowTranslatedWhenHoveringThisLang").checked =
          FTConfig
            .get("langsToTranslateWhenHovering")
            .indexOf(originalTabLanguage) !== -1;
        $("#lblShowTranslatedWhenHoveringThisLang").textContent =
          translatedWhenHoveringThisLangText;
        $("#cbShowTranslatedWhenHoveringThisLang").removeAttribute("disabled");

        if (
          FTConfig
            .get("langsToTranslateWhenHovering")
            .indexOf(originalTabLanguage) === -1
        ) {
          $(
            "option[data-i18n=lblShowTranslatedWhenHoveringThisLang]"
          ).textContent = translatedWhenHoveringThisLangText;
        } else {
          $(
            "option[data-i18n=lblShowTranslatedWhenHoveringThisLang]"
          ).textContent = "✔ " + translatedWhenHoveringThisLangText;
        }
        $(
          "option[data-i18n=lblShowTranslatedWhenHoveringThisLang]"
        ).removeAttribute("hidden");

        const neverTranslateLangText = FTI18n.getMessage(
          "btnNeverTranslateThisLanguage"
        );
        if (
          FTConfig.get("neverTranslateLangs").indexOf(originalTabLanguage) ===
          -1
        ) {
          $("option[data-i18n=btnNeverTranslateThisLanguage]").textContent =
            neverTranslateLangText;
        } else {
          $("option[data-i18n=btnNeverTranslateThisLanguage]").textContent =
            "✔ " + neverTranslateLangText;
        }
        $("option[data-i18n=btnNeverTranslateThisLanguage]").style.display =
          "block";
      }
    }
    updateInterface();

    function enableDarkMode() {
      if (!$("#darkModeElement")) {
        const el = document.createElement("style");
        el.setAttribute("id", "darkModeElement");
        el.setAttribute("rel", "stylesheet");
        el.textContent = `
            body {
                color: rgb(231, 230, 228) !important;
                background-color: #181a1b !important;
            }
            
            .mdiv, .md, {
                background-color: rgb(231, 230, 228);
            }

            .menuDot {
                background-image:
                    radial-gradient(rgb(231, 230, 228) 2px, transparent 2px),
                    radial-gradient(rgb(231, 230, 228) 2px, transparent 2px),
                    radial-gradient(rgb(231, 230, 228) 2px, transparent 2px);
            }

            #btnSwitchInterfaces:hover, #divMenu:hover {
                background-color: #454a4d !important;
                color: rgb(231, 230, 228) !important;
            }
            
            select {
                color: rgb(231, 230, 228) !important;
                background-color: #181a1b !important;
            }

            hr {
                border-color: #666;
            }

            .arrow {
                border-color: rgb(231, 230, 228);
            }

            #btnImproveTranslation {
              color: rgb(231, 230, 228) !important;
              background-color: #181a1b !important;
              border: 1px solid #454a4d !important;
            }
            `;
        document.head.appendChild(el);
      }
    }

    function disableDarkMode() {
      if ($("#darkModeElement")) {
        $("#darkModeElement").remove();
      }
    }

    switch (FTConfig.get("darkMode")) {
      case "auto":
        if (matchMedia("(prefers-color-scheme: dark)").matches) {
          enableDarkMode();
        } else {
          disableDarkMode();
        }
        break;
      case "yes":
        enableDarkMode();
        break;
      case "no":
        disableDarkMode();
        break;
      default:
        break;
    }

    $("#btnPatreon").onclick = (e) => {
      window.open("https://www.patreon.com/filipeps", "_blank");
    };

    $("#btnSwitchInterfaces").addEventListener("click", () => {
      FTConfig.set("useOldPopup", "yes");
      window.location = "old-popup.html";
    });

    $("#divIconTranslate").addEventListener("click", () => {
      currentPageTranslatorService = FTConfig.swapPageTranslationService();

      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        (tabs) => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              action: "swapTranslationService",
              newServiceName: currentPageTranslatorService,
            },
            checkedLastError
          );
        }
      );

      updateInterface();
    });

    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        $("#cbAlwaysTranslateThisLang").addEventListener("change", (e) => {
          const hostname = new URL(tabs[0].url).hostname;
          if (e.target.checked) {
            FTConfig.addLangToAlwaysTranslate(originalTabLanguage, hostname);
            translateOrRestorePagePage();
          } else {
            FTConfig.removeLangFromAlwaysTranslate(originalTabLanguage);
          }
        });

        $("#cbAlwaysTranslateThisSite").addEventListener("change", (e) => {
          const hostname = new URL(tabs[0].url).hostname;
          if (e.target.checked) {
            FTConfig.addSiteToAlwaysTranslate(hostname);
            translateOrRestorePagePage();
          } else {
            FTConfig.removeSiteFromAlwaysTranslate(hostname);
          }
        });

        $("#cbShowTranslateSelectedButton").addEventListener("change", (e) => {
          if (e.target.checked) {
            FTConfig.set("showTranslateSelectedButton", "yes");
          } else {
            FTConfig.set("showTranslateSelectedButton", "no");
          }
        });

        $("#cbShowOriginalWhenHovering").addEventListener("change", (e) => {
          if (e.target.checked) {
            FTConfig.set("showOriginalTextWhenHovering", "yes");
          } else {
            FTConfig.set("showOriginalTextWhenHovering", "no");
          }
        });

        $("#cbShowTranslatedWhenHoveringThisSite").addEventListener(
          "change",
          (e) => {
            const hostname = new URL(tabs[0].url).hostname;
            if (e.target.checked) {
              FTConfig.addSiteToTranslateWhenHovering(hostname);
            } else {
              FTConfig.removeSiteFromTranslateWhenHovering(hostname);
            }
          }
        );

        $("#cbShowTranslatedWhenHoveringThisLang").addEventListener(
          "change",
          (e) => {
            if (e.target.checked) {
              FTConfig.addLangToTranslateWhenHovering(originalTabLanguage);
            } else {
              FTConfig.removeLangFromTranslateWhenHovering(
                originalTabLanguage
              );
            }
          }
        );

        $("#cbShowTranslateSelectedButton").checked =
          FTConfig.get("showTranslateSelectedButton") == "yes" ? true : false;
        $("#cbShowOriginalWhenHovering").checked =
          FTConfig.get("showOriginalTextWhenHovering") == "yes" ? true : false;

        const hostname = new URL(tabs[0].url).hostname;
        $("#cbAlwaysTranslateThisSite").checked =
          FTConfig.get("alwaysTranslateSites").indexOf(hostname) !== -1;
        $("#cbShowTranslatedWhenHoveringThisSite").checked =
          FTConfig.get("sitesToTranslateWhenHovering").indexOf(hostname) !==
          -1;

        {
          const text = FTI18n.getMessage("lblShowTranslateSelectedButton");
          if (FTConfig.get("showTranslateSelectedButton") !== "yes") {
            $("option[data-i18n=lblShowTranslateSelectedButton]").textContent =
              text;
          } else {
            $("option[data-i18n=lblShowTranslateSelectedButton]").textContent =
              "✔ " + text;
          }
        }
        {
          const text = FTI18n.getMessage("lblShowOriginalTextWhenHovering");
          if (FTConfig.get("showOriginalTextWhenHovering") !== "yes") {
            $("option[data-i18n=lblShowOriginalTextWhenHovering]").textContent =
              text;
          } else {
            $("option[data-i18n=lblShowOriginalTextWhenHovering]").textContent =
              "✔ " + text;
          }
        }
        {
          const text = FTI18n.getMessage(
            "lblShowTranslatedWhenHoveringThisSite"
          );
          if (
            FTConfig.get("sitesToTranslateWhenHovering").indexOf(hostname) ===
            -1
          ) {
            $(
              "option[data-i18n=lblShowTranslatedWhenHoveringThisSite]"
            ).textContent = text;
          } else {
            $(
              "option[data-i18n=lblShowTranslatedWhenHoveringThisSite]"
            ).textContent = "✔ " + text;
          }
        }
      }
    );

    $("#btnOptions").addEventListener("change", (event) => {
      const btnOptions = event.target;

      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        (tabs) => {
          const hostname = new URL(tabs[0].url).hostname;
          switch (btnOptions.value) {
            case "changeLanguage":
              location = chrome.runtime.getURL(
                "/popup/improve-translation.html"
              );
              break;
            case "alwaysTranslateThisSite":
              if (
                FTConfig.get("alwaysTranslateSites").indexOf(hostname) === -1
              ) {
                FTConfig.addSiteToAlwaysTranslate(hostname);
              } else {
                FTConfig.removeSiteFromAlwaysTranslate(hostname);
              }
              window.close();
              break;
            case "neverTranslateThisSite":
              if (
                FTConfig.get("neverTranslateSites").indexOf(hostname) === -1
              ) {
                FTConfig.addSiteToNeverTranslate(hostname);
                translateOrRestorePagePage("original");
              } else {
                FTConfig.removeSiteFromNeverTranslate(hostname);
              }
              window.close();
              break;
            case "alwaysTranslateThisLanguage":
              if (
                FTConfig
                  .get("alwaysTranslateLangs")
                  .indexOf(originalTabLanguage) === -1
              ) {
                FTConfig.addLangToAlwaysTranslate(
                  originalTabLanguage,
                  hostname
                );
              } else {
                FTConfig.removeLangFromAlwaysTranslate(originalTabLanguage);
              }
              window.close();
              break;
            case "neverTranslateThisLanguage":
              if (
                FTConfig
                  .get("neverTranslateLangs")
                  .indexOf(originalTabLanguage) === -1
              ) {
                FTConfig.addLangToNeverTranslate(
                  originalTabLanguage,
                  hostname
                );
                translateOrRestorePagePage("original");
              } else {
                FTConfig.removeLangFromNeverTranslate(originalTabLanguage);
              }
              window.close();
              break;
            case "showTranslateSelectedButton":
              if (FTConfig.get("showTranslateSelectedButton") === "yes") {
                FTConfig.set("showTranslateSelectedButton", "no");
              } else {
                FTConfig.set("showTranslateSelectedButton", "yes");
              }
              window.close();
              break;
            case "showOriginalTextWhenHovering":
              if (FTConfig.get("showOriginalTextWhenHovering") === "yes") {
                FTConfig.set("showOriginalTextWhenHovering", "no");
              } else {
                FTConfig.set("showOriginalTextWhenHovering", "yes");
              }
              window.close();
              break;
            case "showTranslatedWhenHoveringThisSite":
              if (
                FTConfig
                  .get("sitesToTranslateWhenHovering")
                  .indexOf(hostname) === -1
              ) {
                FTConfig.addSiteToTranslateWhenHovering(hostname);
              } else {
                FTConfig.removeSiteFromTranslateWhenHovering(hostname);
              }
              window.close();
              break;
            case "showTranslatedWhenHoveringThisLang":
              if (
                FTConfig
                  .get("langsToTranslateWhenHovering")
                  .indexOf(originalTabLanguage) === -1
              ) {
                FTConfig.addLangToTranslateWhenHovering(originalTabLanguage);
              } else {
                FTConfig.removeLangFromTranslateWhenHovering(
                  originalTabLanguage
                );
              }
              window.close();
              break;
            case "translateInExternalSite":
              chrome.tabs.query(
                {
                  active: true,
                  currentWindow: true,
                },
                (tabs) => {
                  if (currentPageTranslatorService === "yandex") {
                    tabsCreate(
                      `https://translate.yandex.com/translate?view=compact&url=${encodeURIComponent(
                        tabs[0].url
                      )}&lang=${FTConfig.get("targetLanguage").split("-")[0]}`
                    );
                  } else {
                    // google
                    tabsCreate(
                      `https://translate.google.com/translate?tl=${FTConfig.get(
                        "targetLanguage"
                      )}&u=${encodeURIComponent(tabs[0].url)}`
                    );
                  }
                }
              );
              break;
            case "moreOptions":
              tabsCreate(chrome.runtime.getURL("/options/options.html"));
              break;
            case "donate":
              tabsCreate(
                chrome.runtime.getURL("/options/options.html#donation")
              );
              break;
            case "translatePDF":
              tabsCreate("https://pdf.translatewebpages.org/");
              break;
            default:
              break;
          }
          btnOptions.value = "options";
        }
      );
    });

    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => {
        const hostname = new URL(tabs[0].url).hostname;
        const textNever = FTI18n.getMessage("btnNeverTranslate");
        if (FTConfig.get("neverTranslateSites").indexOf(hostname) === -1) {
          $("option[data-i18n=btnNeverTranslate]").textContent = textNever;
        } else {
          $("option[data-i18n=btnNeverTranslate]").textContent =
            "✔ " + textNever;
        }

        const textAlways = FTI18n.getMessage("btnAlwaysTranslate");
        if (FTConfig.get("alwaysTranslateSites").indexOf(hostname) === -1) {
          $("option[data-i18n=btnAlwaysTranslate]").textContent = textAlways;
        } else {
          $("option[data-i18n=btnAlwaysTranslate]").textContent =
            "✔ " + textAlways;
        }

        $("option[data-i18n=btnDonate]").innerHTML += " &#10084;";
      }
    );
  });
