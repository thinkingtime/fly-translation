
# <img src="https://github.com/thinkingtime/fly-translation/blob/master/src/icons/icon-128.png" height="50"> Fly Translation

Translate your page in real time using Google or Yandex.

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/FilipePS/fly-translation?label=latest%20version&sort=semver)](https://github.com/thinkingtime/fly-translation/releases)
[![GitHub release date](https://img.shields.io/github/release-date/FilipePS/fly-translation?labely)](https://github.com/thinkingtime/fly-translation/latest)
[![GitHub issues](https://img.shields.io/github/issues/FilipePS/fly-translation?color=red)](https://github.com/thinkingtime/fly-translation/issues)
[![GitHub license](https://img.shields.io/github/license/FilipePS/fly-translation?color=lightgrey)](https://github.com/thinkingtime/fly-translation/blob/master/LICENSE)

## Install

### Firefox
- Desktop users, download from [Mozilla Addons](https://addons.mozilla.org/firefox/addon/fly-translation/).
- Android users
  1. Install the latest version of _Firefox (v120+)_.
  2. Open the extension manager.
  3. Scroll down and click **Find more add-ons**.
  4. On the add-ons website, search for **FT**.
  5. Install the **FT - Translate For Mobile** extension.


### Vivaldi, Opera, Maxthon, Chromium and Yandex
1. Download this CRX file [FT_Chromium.crx](https://github.com/thinkingtime/fly-translation/releases/download/v10.0.1.0/FT_10.0.1.0_Chromium.crx)
2. Open your browser's extension manager, you can find it at this link: `chrome://extensions`
3. Activate developer mode
4. Reload the extension manager page to avoid errors
5. Drag and drop the **FT_Chromium.crx** file into the extension manager
6. Note 1: In Opera, Maxthon and Yandex you don't need to enable developer mode
7. Note 2: In Yandex you need to reactivate the extension every time you open the browser

### Chrome, Edge and Brave (With folder without auto update)
1. Download and extract this ZIP file [FT_Chromium.zip](https://github.com/thinkingtime/fly-translation/releases/download/v10.0.1.0/FT_10.0.1.0_Chromium.zip)
2. Open your browser's extension manager, you can find it at this link: `chrome://extensions`
3. Activate developer mode
4. Reload the extension manager page to avoid errors
5. Drag and drop the **FT_Chromium** folder into the extension manager

### Chrome, Edge and Brave (With CRX and auto update)
- By default, these browsers block the installation of extensions outside the official extension store, however, changing a windows registry it is possible to reverse this, allowing the installation of certain extensions. If you want to do this, follow the tutorial below:

1. Download this and run this file [FT-registry-install.reg](https://raw.githubusercontent.com/FilipePS/fly-translation/master/dist/chromium/FT-registry-install.reg). It edit the necessary windows registries
2. Close your browser and reopen it
3. Download this CRX file [FT_Chromium.crx](https://github.com/thinkingtime/fly-translation/releases/download/v10.0.1.0/FT_10.0.1.0_Chromium.crx)
4. Open your browser's extension manager, you can find it at this link: `chrome://extensions`
5. Activate developer mode
6. Reload the extension manager page to avoid errors
7. Drag and drop the **FT_Chromium.crx** file into the extension manager
8. Note: If you want to undo registry changes, download and run this [FT-registry-uninstall-self.reg](https://raw.githubusercontent.com/FilipePS/fly-translation/master/dist/chromium/FT-registry-uninstall-self.reg). If you want a deeper removal download and run this other file [FT-registry-uninstall-all.reg](https://raw.githubusercontent.com/FilipePS/fly-translation/master/dist/chromium/FT-registry-uninstall-all.reg)

## Screenshots
| Menu 1 | Menu 2 | Translated |
| :--: | :--: | :--: |
| <img src="https://addons.mozilla.org/user-media/previews/full/258/258434.png" height="200"> | <img src="https://addons.mozilla.org/user-media/previews/full/258/258435.png" height="200"> | <img src="https://addons.mozilla.org/user-media/previews/full/258/258436.png" height="200"> |

## Contribute

- To collaborate with the translation of the extension interface use [Crowdin](https://crowdin.com/project/translate-web-pages).

## Donations

To make a donation use [Patreon](https://www.patreon.com/filipeps).

[<img src="https://github.com/thinkingtime/fly-translation/blob/master/src/icons/patreon.png" alt="Patreon" height="50">](https://www.patreon.com/filipeps)

## FAQ

**What can this extension do?**

Your current page is translated without having to open new tabs.
It is possible to change the translation language.
You can select to automatically translate.
To change the translation engine just touch the Google Translate icon. 

**Why do you need to access your data on all the websites you visit?**

To translate any website it is necessary to access and modify the text of the web pages. And the extension can only do that, with that permission.

**How are the pages translated?**

The pages are translated using the Google or Yandex translation engine (you choose).

**And how's my privacy?**

[Privacy policy](https://addons.mozilla.org/addon/fly-translation/privacy/): We do not collect any information. However, to translate, the contents of the web pages will be sent to Google or Yandex servers.

**Limitations**

Some pages like [support.mozilla.org](https://support.mozilla.org/) and [addons.mozilla.org](http://addons.mozilla.org/) will not be translated. For security reasons, the browser blocks extensions from accessing these sites.

## Build instructions
- You can see all the build instructions in the [build-instructions.md](build-instructions.md) file.