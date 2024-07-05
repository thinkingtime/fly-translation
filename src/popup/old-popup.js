"use strict";

var $ = document.querySelector.bind(document);

FTConfig
  .onReady()
  .then(() => FTI18n.updateUiMessages())
  .then(() => {
    FTI18n.translateDocument();

    if (!navigator.userAgent.includes("Firefox")) {
      document.body.style.minWidth = "300px";
    }

    $("#btnImproveTranslation").onclick = () => {
      window.location = "improve-translation.html";
    };

    // get elements
    const btnSwitchInterfaces = document.getElementById("btnSwitchInterfaces");
    const divIconTranslateContainer = document.getElementById(
      "divIconTranslateContainer"
    );
    const divIconTranslate = document.getElementById("divIconTranslate");
    const iconTranslate = document.getElementById("iconTranslate");

    const lblTranslate = document.getElementById("lblTranslate");
    const lblTranslating = document.getElementById("lblTranslating");
    const lblTranslated = document.getElementById("lblTranslated");
    const lblError = document.getElementById("lblError");
    const lblTargetLanguage = document.getElementById("lblTargetLanguage");

    const divAlwaysTranslate = document.getElementById(
      "divAlwaysTranslateThisLang"
    );
    const cbAlwaysTranslate = document.getElementById(
      "cbAlwaysTranslateThisLang"
    );
    const lblAlwaysTranslate = document.getElementById(
      "lblAlwaysTranslateThisLang"
    );

    const selectTargetLanguage = document.getElementById(
      "selectTargetLanguage"
    );

    const divOptionsList = document.getElementById("divOptionsList");

    const btnReset = document.getElementById("btnReset");
    const btnTranslate = document.getElementById("btnTranslate");
    const btnRestore = document.getElementById("btnRestore");
    const btnTryAgain = document.getElementById("btnTryAgain");
    const btnOptionsDiv = document.getElementById("btnOptionsDiv");
    const btnOptions = document.getElementById("btnOptions");
    const divShowTranslateSelectedButton = document.getElementById(
      "divShowTranslateSelectedButton"
    );
    const cbShowTranslateSelectedButton = document.getElementById(
      "cbShowTranslateSelectedButton"
    );

    cbShowTranslateSelectedButton.oninput = (e) => {
      console.log(e.target.checked);
      FTConfig.set(
        "showTranslateSelectedButton",
        e.target.checked ? "yes" : "no"
      );
    };
    cbShowTranslateSelectedButton.checked =
      FTConfig.get("showTranslateSelectedButton") == "yes" ? true : false;

    $("#btnPatreon").onclick = (e) => {
      window.open("https://www.patreon.com/filipeps", "_blank");
    };

    $("#btnOptionB").innerHTML += ' <i class="arrow down"></i>';
    $("#btnOptions option[value='donate']").innerHTML += " &#10084;";

    var cStyle = getComputedStyle(document.querySelector("#btnOptionB"));
    btnOptions.style.width = parseInt(cStyle.width) + 0 + "px";

    // fill language list
    {
      let langs = FTLang.getLanguageList();
      lblTranslate.textContent = FTI18n.getMessage(
        "lblTranslatePageInto",
        langs[FTConfig.get("targetLanguage")] ||
          FTConfig.get("targetLanguage")
      );
      lblTranslated.textContent = FTI18n.getMessage(
        "lblPageTranslateInto",
        langs[FTConfig.get("targetLanguage")] ||
          FTConfig.get("targetLanguage")
      );

      const langsSorted = [];

      for (const i in langs) {
        langsSorted.push([i, langs[i]]);
      }

      langsSorted.sort(function (a, b) {
        return a[1].localeCompare(b[1]);
      });

      const eAllLangs = selectTargetLanguage.querySelector('[name="all"]');
      langsSorted.forEach((value) => {
        const option = document.createElement("option");
        option.value = value[0];
        option.textContent = value[1];
        eAllLangs.appendChild(option);
      });

      const eRecentsLangs =
        selectTargetLanguage.querySelector('[name="recents"]');
      FTConfig.get("targetLanguages").forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = langs[value];
        eRecentsLangs.appendChild(option);
      });
    }
    selectTargetLanguage.value = FTConfig.get("targetLanguage");

    function enableDarkMode() {
      if (!document.getElementById("darkModeElement")) {
        const el = document.createElement("style");
        el.setAttribute("id", "darkModeElement");
        el.setAttribute("rel", "stylesheet");
        el.textContent = `
            * {
                scrollbar-color: #202324 #454a4d;
            }
            
            body {
                color: #e8e6e3 !important;
                background-color: #181a1b !important;
                border: 1px solid #454a4d;
            }
            
            #btnSwitchInterfaces:hover {
                background-color: #454a4d !important;
                color: rgb(231, 230, 228) !important;
            }
            
            #selectTargetLanguage, #btnReset, #btnRestore, #btnTryAgain, #btnOptionB, #btnImproveTranslation {
                color: #55a9ed !important;
                background-color: #181a1b !important;
                border: 1px solid #454a4d !important;
            }

            #btnImproveTranslation {
              color: rgb(231, 230, 228) !important;
            }

            select, option {
              color: GhostWhite !important;
              background-color: #181a1b !important;
            }
            `;
        document.head.appendChild(el);
      }
    }

    function disableDarkMode() {
      if (document.getElementById("darkModeElement")) {
        document.getElementById("darkModeElement").remove();
      }
    }

    if (FTConfig.get("darkMode") == "auto") {
      if (matchMedia("(prefers-color-scheme: dark)").matches) {
        enableDarkMode();
      } else {
        disableDarkMode();
      }
    } else if (FTConfig.get("darkMode") == "yes") {
      enableDarkMode();
    } else {
      disableDarkMode();
    }

    let originalTabLanguage = "und";
    let currentPageLanguage = "und";
    let currentPageLanguageState = "original";
    let currentPageTranslatorService = FTConfig.get("pageTranslatorService");

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
              tabLanguage &&
              (tabLanguage = FTLang.fixTLanguageCode(tabLanguage))
            ) {
              originalTabLanguage = tabLanguage;
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

    let showSelectTargetLanguage = false;

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

      let showAlwaysTranslateCheckbox = false;

      if (
        originalTabLanguage !== "und" &&
        originalTabLanguage !== FTConfig.get("targetLanguage")
      ) {
        showAlwaysTranslateCheckbox = true;
      }

      if (originalTabLanguage !== "und") {
        $("#cbAlwaysTranslateThisLang").checked =
          FTConfig.get("alwaysTranslateLangs").indexOf(originalTabLanguage) !==
          -1;
        $("#lblAlwaysTranslateThisLang").textContent = FTI18n.getMessage(
          "lblAlwaysTranslate",
          FTLang.codeToLanguage(originalTabLanguage)
        );

        const translatedWhenHoveringThisLangText = FTI18n.getMessage(
          "lblShowTranslatedWhenHoveringThisLang",
          FTLang.codeToLanguage(originalTabLanguage)
        );
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

      btnRestore.className = btnRestore.className.replace(" w3-disabled", "");
      cbAlwaysTranslate.removeAttribute("disabled");

      if (showSelectTargetLanguage) {
        lblTranslate.style.display = "none";
        lblTranslating.style.display = "none";
        lblTranslated.style.display = "none";
        lblError.style.display = "none";
        lblTargetLanguage.style.display = "inline";

        selectTargetLanguage.style.display = "inline";
        btnReset.style.display = "inline";

        divAlwaysTranslate.style.display = "none";
        btnTranslate.style.display = "inline";
        btnRestore.style.display = "none";
        btnTryAgain.style.display = "none";
        btnOptionsDiv.style.display = "none";
      } else {
        divIconTranslateContainer.style.display = "none";
        lblTargetLanguage.style.display = "none";
        selectTargetLanguage.style.display = "none";
        btnReset.style.display = "none";

        divShowTranslateSelectedButton.style.display = "none";

        switch (currentPageLanguageState) {
          case "translated":
            lblTranslate.style.display = "none";
            lblTranslating.style.display = "none";
            lblTranslated.style.display = "inline";
            lblError.style.display = "none";

            divAlwaysTranslate.style.display = "none";
            btnTranslate.style.display = "none";
            btnRestore.style.display = "inline";
            btnTryAgain.style.display = "none";
            btnOptionsDiv.style.display = "inline";

            divShowTranslateSelectedButton.style.display = "block";

            divIconTranslateContainer.style.display = "block";

            break;
          case "translating":
            lblTranslate.style.display = "none";
            lblTranslating.style.display = "inline";
            lblTranslated.style.display = "none";
            lblError.style.display = "none";

            divAlwaysTranslate.style.display = "none";
            btnTranslate.style.display = "none";
            btnRestore.style.display = "inline";
            btnTryAgain.style.display = "none";
            btnOptionsDiv.style.display = "none";

            if (btnRestore.className.indexOf("w3-disabled") == -1) {
              btnRestore.className += " w3-disabled";
            }
            break;
          case "error":
            lblTranslate.style.display = "none";
            lblTranslating.style.display = "none";
            lblTranslated.style.display = "none";
            lblError.style.display = "inline";

            divAlwaysTranslate.style.display = "none";
            btnTranslate.style.display = "none";
            btnRestore.style.display = "none";
            btnTryAgain.style.display = "inline";
            btnOptionsDiv.style.display = "none";

            divIconTranslateContainer.style.display = "block";
            break;
          default:
            lblTranslate.style.display = "inline";
            lblTranslating.style.display = "none";
            lblTranslated.style.display = "none";
            lblError.style.display = "none";

            divAlwaysTranslate.style.display = "block";
            showAlwaysTranslateCheckbox
              ? void 0
              : cbAlwaysTranslate.setAttribute("disabled", "disabled");
            btnTranslate.style.display = "inline";
            btnRestore.style.display = "none";
            btnTryAgain.style.display = "none";
            btnOptionsDiv.style.display = "inline";

            divIconTranslateContainer.style.display = "block";
            break;
        }
      }
    }
    updateInterface();

    function onTranslateClick() {
      currentPageLanguageState = "translated";

      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        (tabs) => {
          if (FTConfig.get("targetLanguage") !== selectTargetLanguage.value) {
            FTConfig.setTargetLanguage(selectTargetLanguage.value, true);
          } else {
            FTConfig.setTargetLanguage(selectTargetLanguage.value);
          }

          const langs = FTLang.getLanguageList();
          lblTranslate.textContent = FTI18n.getMessage(
            "lblTranslatePageInto",
            langs[FTConfig.get("targetLanguage")] ||
              FTConfig.get("targetLanguage")
          );
          lblTranslated.textContent = FTI18n.getMessage(
            "lblPageTranslateInto",
            langs[FTConfig.get("targetLanguage")] ||
              FTConfig.get("targetLanguage")
          );

          if (FTConfig.get("enableIframePageTranslation") === "yes") {
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                action: "translatePage",
                targetLanguage: selectTargetLanguage.value,
              },
              checkedLastError
            );
          } else {
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                action: "translatePage",
                targetLanguage: selectTargetLanguage.value,
              },
              {frameId: 0},
              checkedLastError
            );
          }
        }
      );

      showSelectTargetLanguage = false;
      updateInterface();
    }

    $("#btnTranslate").onclick = () => onTranslateClick();

    function onRestoreClick() {
      currentPageLanguageState = "original";

      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        (tabs) => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              action: "restorePage",
            },
            checkedLastError
          );
        }
      );

      updateInterface();
    }

    $("#btnRestore").onclick = () => onRestoreClick();

    $("#btnSwitchInterfaces").addEventListener("click", () => {
      FTConfig.set("useOldPopup", "no");
      window.location = "popup.html";
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
          } else {
            FTConfig.removeLangFromAlwaysTranslate(originalTabLanguage);
          }
        });
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
              showSelectTargetLanguage = true;
              updateInterface();
              break;
            case "alwaysTranslateThisSite":
              if (
                FTConfig.get("alwaysTranslateSites").indexOf(hostname) === -1
              ) {
                FTConfig.addSiteToAlwaysTranslate(hostname);
                onTranslateClick();
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
                onRestoreClick();
              } else {
                FTConfig.removeSiteFromNeverTranslate(hostname);
              }
              window.close();
              break;
            case "alwaysTranslateThisLanguage":
              FTConfig.addLangToAlwaysTranslate(originalTabLanguage, hostname);
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
                onRestoreClick();
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

        const btnNeverTranslateText = FTI18n.getMessage("btnNeverTranslate");
        if (FTConfig.get("neverTranslateSites").indexOf(hostname) === -1) {
          $("option[data-i18n=btnNeverTranslate]").textContent =
            btnNeverTranslateText;
        } else {
          $("option[data-i18n=btnNeverTranslate]").textContent =
            "✔ " + btnNeverTranslateText;
        }

        const btnAlwaysTranslateText = FTI18n.getMessage("btnAlwaysTranslate");
        if (FTConfig.get("alwaysTranslateSites").indexOf(hostname) === -1) {
          $("option[data-i18n=btnAlwaysTranslate]").textContent =
            btnAlwaysTranslateText;
        } else {
          $("option[data-i18n=btnAlwaysTranslate]").textContent =
            "✔ " + btnAlwaysTranslateText;
        }

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
  });
