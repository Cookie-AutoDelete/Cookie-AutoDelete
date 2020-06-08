/**
 * Copyright (c) 2017-2020 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
 * Licensed under MIT (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {
   addExpressionUI,
   cookieCleanup,
   updateSetting,
} from '../redux/Actions';
import {
  clearCookiesForThisDomain,
  clearLocalstorageForThisDomain,
} from './CleanupService';
import {
  cadLog,
  getHostname,
  getSetting,
  localFileToRegex,
  parseCookieStoreId,
  showNotification,
} from './Libs';
import StoreUser from './StoreUser';

export default class ContextMenuEvents extends StoreUser {
  public static MENUID = {
    ACTIVE_MODE: "cad-active-mode",
    CLEAN: "cad-clean",
    CLEAN_COOKIES: "cad-clean-cookies",
    CLEAN_LOCALSTORAGE: "cad-clean-localstorage",
    CLEAN_OPEN: "cad-clean-open",
    LINK_ADD_GREY_DOMAIN: "cad-link-add-grey-domain",
    LINK_ADD_GREY_SUBS: "cad-link-add-grey-subs",
    LINK_ADD_WHITE_DOMAIN: "cad-link-add-white-domain",
    LINK_ADD_WHITE_SUBS: "cad-link-add-white-subs",
    PAGE_ADD_GREY_DOMAIN: "cad-page-add-grey-domain",
    PAGE_ADD_GREY_SUBS: "cad-page-add-grey-subs",
    PAGE_ADD_WHITE_DOMAIN: "cad-page-add-white-domain",
    PAGE_ADD_WHITE_SUBS: "cad-page-add-white-subs",
    PARENT_CLEAN: "cad-parent-clean",
    PARENT_EXPRESSION: "cad-parent-expression",
    PARENT_LINK_DOMAIN: "cad-parent-link-domain",
    PARENT_LINK_SUBS: "cad-parent-link-subs",
    PARENT_PAGE_DOMAIN: "cad-parent-page-domain",
    PARENT_PAGE_SUBS: "cad-parent-page-subs",
    PARENT_SELECT_DOMAIN: "cad-parent-select-domain",
    PARENT_SELECT_SUBS: "cad-parent-select-subs",
    SELECT_ADD_GREY_DOMAIN: "cad-select-add-grey-domain",
    SELECT_ADD_GREY_SUBS: "cad-select-add-grey-subs",
    SELECT_ADD_WHITE_DOMAIN: "cad-select-add-white-domain",
    SELECT_ADD_WHITE_SUBS: "cad-select-add-white-subs",
    SETTINGS: "cad-settings",
  }

  public static menuInit(
    state: State,
  ) {
    if (!browser.contextMenus) return;
    const defaultContexts = [
      "browser_action",
      "page"
    ] as browser.contextMenus.ContextType[];
    // Clean Option Group
    browser.contextMenus.create({
      contexts: defaultContexts,
      id: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('contextMenusParentClean'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Regular Clean (exclude open tabs)
    browser.contextMenus.create({
      contexts: defaultContexts,
      id: ContextMenuEvents.MENUID.CLEAN,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('cleanText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Clean (include open tabs)
    browser.contextMenus.create({
      contexts: defaultContexts,
      id: ContextMenuEvents.MENUID.CLEAN_OPEN,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('cleanIgnoringOpenTabsText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Separator
    browser.contextMenus.create({
      contexts: defaultContexts,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      type: "separator",
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Cleanup Warning
    browser.contextMenus.create({
      contexts: defaultContexts,
      enabled: false,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('cleanupActionsBypass'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Clean cookies for domain
    browser.contextMenus.create({
      contexts: defaultContexts,
      id: ContextMenuEvents.MENUID.CLEAN_COOKIES,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('clearSiteDataText', ['cookies']),
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Clean localstorage for domain
    browser.contextMenus.create({
      contexts: defaultContexts,
      id: ContextMenuEvents.MENUID.CLEAN_LOCALSTORAGE,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('clearSiteDataText', ['localstorage']),
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Separator
    browser.contextMenus.create({
      contexts: defaultContexts,
      type: "separator",
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Add Expression Option Group - page
    browser.contextMenus.create({
      contexts: ['link', 'page', 'selection'],
      id: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: browser.i18n.getMessage('contextMenusParentExpression'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Link Group
    browser.contextMenus.create({
      contexts: ['link'],
      id: ContextMenuEvents.MENUID.PARENT_LINK_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: browser.i18n.getMessage('contextMenusSelectedDomain', [browser.i18n.getMessage('linkText')]),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['link'],
      id: ContextMenuEvents.MENUID.LINK_ADD_GREY_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_LINK_DOMAIN,
      title: browser.i18n.getMessage('toGreyListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['link'],
      id: ContextMenuEvents.MENUID.LINK_ADD_WHITE_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_LINK_DOMAIN,
      title: browser.i18n.getMessage('toWhiteListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['link'],
      id: ContextMenuEvents.MENUID.PARENT_LINK_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: browser.i18n.getMessage('contextMenusSelectedSubdomain', [browser.i18n.getMessage('linkText')]),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['link'],
      id: ContextMenuEvents.MENUID.LINK_ADD_GREY_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_LINK_SUBS,
      title: browser.i18n.getMessage('toGreyListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['link'],
      id: ContextMenuEvents.MENUID.LINK_ADD_WHITE_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_LINK_SUBS,
      title: browser.i18n.getMessage('toWhiteListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);

    // Page Group
    browser.contextMenus.create({
      contexts: ['page'],
      id: ContextMenuEvents.MENUID.PARENT_PAGE_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: browser.i18n.getMessage('contextMenusSelectedDomain', [browser.i18n.getMessage('pageText')]),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['page'],
      id: ContextMenuEvents.MENUID.PAGE_ADD_GREY_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_PAGE_DOMAIN,
      title: browser.i18n.getMessage('toGreyListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['page'],
      id: ContextMenuEvents.MENUID.PAGE_ADD_WHITE_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_PAGE_DOMAIN,
      title: browser.i18n.getMessage('toWhiteListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['page'],
      id: ContextMenuEvents.MENUID.PARENT_PAGE_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: browser.i18n.getMessage('contextMenusSelectedSubdomain', [browser.i18n.getMessage('pageText')]),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['page'],
      id: ContextMenuEvents.MENUID.PAGE_ADD_GREY_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_PAGE_SUBS,
      title: browser.i18n.getMessage('toGreyListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['page'],
      id: ContextMenuEvents.MENUID.PAGE_ADD_WHITE_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_PAGE_SUBS,
      title: browser.i18n.getMessage('toWhiteListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);

    // Selection Group
    browser.contextMenus.create({
      contexts: ['selection'],
      id: ContextMenuEvents.MENUID.PARENT_SELECT_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: `${browser.i18n.getMessage('contextMenusSelectedDomain', [browser.i18n.getMessage('selectedText')])} "%s"`,
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['selection'],
      id: ContextMenuEvents.MENUID.SELECT_ADD_GREY_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_SELECT_DOMAIN,
      title: browser.i18n.getMessage('toGreyListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['selection'],
      id: ContextMenuEvents.MENUID.SELECT_ADD_WHITE_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_SELECT_DOMAIN,
      title: browser.i18n.getMessage('toWhiteListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['selection'],
      id: ContextMenuEvents.MENUID.PARENT_SELECT_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: `${browser.i18n.getMessage('contextMenusSelectedSubdomain', [browser.i18n.getMessage('selectedText')])} "%s"`,
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['selection'],
      id: ContextMenuEvents.MENUID.SELECT_ADD_GREY_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_SELECT_SUBS,
      title: browser.i18n.getMessage('toGreyListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
    browser.contextMenus.create({
      contexts: ['selection'],
      id: ContextMenuEvents.MENUID.SELECT_ADD_WHITE_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_SELECT_SUBS,
      title: browser.i18n.getMessage('toWhiteListText'),
    }, ContextMenuEvents.onCreatedOrUpdated);

    // Separator
    browser.contextMenus.create({
      contexts: defaultContexts,
      type: "separator",
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Active Mode
    browser.contextMenus.create({
      checked: state.settings.activeMode.value as boolean,
      contexts: defaultContexts,
      id: ContextMenuEvents.MENUID.ACTIVE_MODE,
      title: browser.i18n.getMessage('activeModeText'),
      type: "checkbox",
    }, ContextMenuEvents.onCreatedOrUpdated);
    // CAD Settings Page.  Opens in a new tab next to the current one.
    browser.contextMenus.create({
      contexts: defaultContexts,
      id: ContextMenuEvents.MENUID.SETTINGS,
      title: browser.i18n.getMessage('settingsText'),
    }, ContextMenuEvents.onCreatedOrUpdated);
  }

  public static updateMenuItemCheckbox(
    id: string,
    checked: boolean,
  ) {
    browser.contextMenus.update(id, {
      checked,
    }).catch(this.onCreatedOrUpdated);
    cadLog({
      msg: `ContextMenuEvents.updateMenuItemCheckbox: Updated Menu Item.`,
      x: {id, checked},
    }, getSetting(StoreUser.store.getState(), 'debugMode') as boolean);
  }

  public static onCreatedOrUpdated() {
    const debug = getSetting(StoreUser.store.getState(), 'debugMode') as boolean;
    if (browser.runtime.lastError) {
      cadLog({
        msg: `ContextMenuEvents.onCreatedOrUpdated received an error: ${browser.runtime.lastError}`,
        type: 'error',
      }, debug);
    } else {
      cadLog({
        msg: `ContextMenuEvents.onCreatedOrUpdated:  Create/Update contextMenuItem was successful.`,
      }, debug);
    }
  }

  public static async onContextMenuClicked(
    info: browser.contextMenus.OnClickData,
    tab: browser.tabs.Tab
  ) {
    const debug = getSetting(StoreUser.store.getState(), 'debugMode') as boolean;
    const contextualIdentities = getSetting(StoreUser.store.getState(), 'contextualIdentities') as boolean;
    cadLog({
      msg: `ContextMenuEvents.onContextMenuClicked:  Data received`,
      x: {info, tab},
    }, debug);
    const cookieStoreId = (tab && tab.cookieStoreId) || '';
    switch (info.menuItemId) {
      case ContextMenuEvents.MENUID.CLEAN:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked triggered Normal Clean.`,
        }, debug);
        StoreUser.store.dispatch<any>(
          cookieCleanup({
            greyCleanup: false,
            ignoreOpenTabs: false,
          }),
        );
        break;
      case ContextMenuEvents.MENUID.CLEAN_OPEN:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked triggered Clean, include open tabs.`,
        }, debug);
        StoreUser.store.dispatch<any>(
          cookieCleanup({
            greyCleanup: false,
            ignoreOpenTabs: true,
          }),
        );
        break;
      case ContextMenuEvents.MENUID.CLEAN_COOKIES:
        {
          cadLog({
            msg: `ContextMenuEvents.onContextMenuClicked triggered Clean All Cookies For This Domain.`,
          }, debug);
          if (getHostname(tab.url)) {
            await clearCookiesForThisDomain(StoreUser.store.getState(), tab);
          } else {
            cadLog({
              msg: `ContextMenuEvents.onContextMenuClicked cannot clean cookies from tab:`,
              type: 'warn',
              x: {tab},
            }, debug);
            showNotification({
              duration: getSetting(StoreUser.store.getState(), 'notificationOnScreen') as number,
              msg: `${browser.i18n.getMessage('manualCleanError', [browser.i18n.getMessage('cookiesText')])}\n
              ${tab.title}\n\n
              ${tab.url}
              `,
            });
          }
        }
        break;
      case ContextMenuEvents.MENUID.CLEAN_LOCALSTORAGE:
        {
          cadLog({
            msg: `ContextMenuEvents.onContextMenuClicked triggered Clean LocalStorage For This Domain.`,
          }, debug);
          if (getHostname(tab.url)) {
            await clearLocalstorageForThisDomain(StoreUser.store.getState(), tab);
          } else {
            showNotification({
              duration: getSetting(StoreUser.store.getState(), 'notificationOnScreen') as number,
              msg: `${browser.i18n.getMessage('manualCleanError', [browser.i18n.getMessage('localStorageText')])}\n
              ${tab.title}\n\n
              ${tab.url}
              `,
            });
          }
        }
        break;
      case ContextMenuEvents.MENUID.LINK_ADD_GREY_DOMAIN:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was LINK_ADD_GREY_DOMAIN.`,
          x: {linkUrl: info.linkUrl, hostname: getHostname(info.linkUrl), cookieStoreId,},
        }, debug);
        ContextMenuEvents.addNewExpression(getHostname(info.linkUrl), ListType.GREY, cookieStoreId);
        break;
      case ContextMenuEvents.MENUID.LINK_ADD_WHITE_DOMAIN:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was LINK_ADD_WHITE_DOMAIN.`,
          x: {linkUrl: info.linkUrl, hostname: getHostname(info.linkUrl), cookieStoreId,},
        }, debug);
        ContextMenuEvents.addNewExpression(getHostname(info.linkUrl), ListType.WHITE, cookieStoreId);
        break;
      case ContextMenuEvents.MENUID.LINK_ADD_GREY_SUBS:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was LINK_ADD_GREY_SUBS.`,
          x: {linkUrl: info.linkUrl, hostname: getHostname(info.linkUrl), cookieStoreId,},
        }, debug);
        ContextMenuEvents.addNewExpression(`*.${getHostname(info.linkUrl)}`, ListType.GREY, cookieStoreId);
        break;
      case ContextMenuEvents.MENUID.LINK_ADD_WHITE_SUBS:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was LINK_ADD_WHITE_SUBS.`,
          x: {linkUrl: info.linkUrl, hostname: getHostname(info.linkUrl), cookieStoreId,},
        }, debug);
        ContextMenuEvents.addNewExpression(`*.${getHostname(info.linkUrl)}`, ListType.WHITE, cookieStoreId);
        break;
      case ContextMenuEvents.MENUID.PAGE_ADD_GREY_DOMAIN:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was PAGE_ADD_GREY_DOMAIN.`,
          x: {pageURL: info.pageUrl, hostname: getHostname(info.pageUrl), cookieStoreId, parsedCookieStoreId: parseCookieStoreId(contextualIdentities, cookieStoreId)},
        }, debug);
        ContextMenuEvents.addNewExpression(getHostname(info.pageUrl), ListType.GREY, cookieStoreId);
        break;
      case ContextMenuEvents.MENUID.PAGE_ADD_WHITE_DOMAIN:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was PAGE_ADD_WHITE_DOMAIN.`,
          x: {pageURL: info.pageUrl, hostname: getHostname(info.pageUrl), cookieStoreId, parsedCookieStoreId: parseCookieStoreId(contextualIdentities, cookieStoreId)},
        }, debug);
        ContextMenuEvents.addNewExpression(getHostname(info.pageUrl), ListType.WHITE, cookieStoreId);
        break;
      case ContextMenuEvents.MENUID.PAGE_ADD_GREY_SUBS:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was PAGE_ADD_GREY_SUBS.`,
          x: {pageURL: info.pageUrl, hostname: getHostname(info.pageUrl), cookieStoreId, parsedCookieStoreId: parseCookieStoreId(contextualIdentities, cookieStoreId)},
        }, debug);
        ContextMenuEvents.addNewExpression(`*.${getHostname(info.pageUrl)}`, ListType.GREY, cookieStoreId);
        break;
      case ContextMenuEvents.MENUID.PAGE_ADD_WHITE_SUBS:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was PAGE_ADD_WHITE_SUBS.`,
          x: {pageURL: info.pageUrl, hostname: getHostname(info.pageUrl), cookieStoreId, parsedCookieStoreId: parseCookieStoreId(contextualIdentities, cookieStoreId)},
        }, debug);
        ContextMenuEvents.addNewExpression(`*.${getHostname(info.pageUrl)}`, ListType.WHITE, cookieStoreId);
        break;
      case ContextMenuEvents.MENUID.SELECT_ADD_GREY_DOMAIN:
      {
        const texts = (info.selectionText || '').trim().split(',');
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was SELECT_ADD_GREY_DOMAIN.`,
          x: {selectionText: info.selectionText, texts, cookieStoreId, parsedCookieStoreId: parseCookieStoreId(contextualIdentities, cookieStoreId)},
        }, debug);
        texts.forEach((text) => {
          cadLog({
            msg: `ContextMenuEvents.onContextMenuClicked:  encodeURI on selected text`,
            x: {rawInput: text.trim(), encodedInput: encodeURI(text.trim())}
          }, debug);
          ContextMenuEvents.addNewExpression(encodeURI(text.trim()), ListType.GREY, cookieStoreId);
        });
      }
        break;
      case ContextMenuEvents.MENUID.SELECT_ADD_WHITE_DOMAIN:
      {
        const texts = (info.selectionText || '').trim().split(',');
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was SELECT_ADD_WHITE_DOMAIN.`,
          x: {selectionText: info.selectionText, texts, cookieStoreId, parsedCookieStoreId: parseCookieStoreId(contextualIdentities, cookieStoreId)},
        }, debug);
        texts.forEach((text) => {
          cadLog({
            msg: `ContextMenuEvents.onContextMenuClicked:  encodeURI on selected text`,
            x: {rawInput: text.trim(), encodedInput: encodeURI(text.trim())}
          }, debug);
          ContextMenuEvents.addNewExpression(encodeURI(text.trim()), ListType.WHITE, cookieStoreId);
        });
      }
        break;
      case ContextMenuEvents.MENUID.SELECT_ADD_GREY_SUBS:
      {
        const texts = (info.selectionText || '').trim().split(',');
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was SELECT_ADD_GREY_SUBS.`,
          x: {selectionText: info.selectionText, texts, cookieStoreId, parsedCookieStoreId: parseCookieStoreId(contextualIdentities, cookieStoreId)},
        }, debug);
        texts.forEach((text) => {
          cadLog({
            msg: `ContextMenuEvents.onContextMenuClicked:  encodeURI on selected text`,
            x: {rawInput: text.trim(), encodedInput: encodeURI(text.trim())}
          }, debug);
          ContextMenuEvents.addNewExpression(`*.${encodeURI(text.trim())}`, ListType.GREY, cookieStoreId);
        });
      }
        break;
      case ContextMenuEvents.MENUID.SELECT_ADD_WHITE_SUBS:
      {
        const texts = (info.selectionText || '').trim().split(',');
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked:  menuItemId was SELECT_ADD_WHITE_SUBS.`,
          x: {selectionText: info.selectionText, texts, cookieStoreId, parsedCookieStoreId: parseCookieStoreId(contextualIdentities, cookieStoreId)},
        }, debug);
        texts.forEach((text) => {
          cadLog({
            msg: `ContextMenuEvents.onContextMenuClicked:  encodeURI on selected text`,
            x: {rawInput: text.trim(), encodedInput: encodeURI(text.trim())}
          }, debug);
          ContextMenuEvents.addNewExpression(`*.${encodeURI(text.trim())}`, ListType.WHITE, cookieStoreId);
        });
      }
        break;
      case ContextMenuEvents.MENUID.ACTIVE_MODE:
        if (info.hasOwnProperty('checked') && info.hasOwnProperty('wasChecked') && info.checked !== info.wasChecked) {
          cadLog({
            msg: `ContextMenuEvents.onContextMenuClicked changed Automatic Cleaning value to:  ${info.checked}.`,
          }, debug);
          // Setting Updated.
          StoreUser.store.dispatch<any>(updateSetting({
            name: 'activeMode',
            value: info.checked!,
          }));
        }
        break;
      case ContextMenuEvents.MENUID.SETTINGS:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked triggered Open Settings.`,
        }, debug);
        browser.tabs.create({
          index: tab.index + 1,
          url: '/settings/settings.html#tabSettings',
        });
        break;
      default:
        cadLog({
          msg: `ContextMenuEvents.onContextMenuClicked received unknown menu id: ${info.menuItemId}`,
          type: 'warn',
          x: {info, tab},
        }, debug);
        break;
    }
  }

  private static addNewExpression(
    input: string,
    listType: ListType,
    cookieStoreId: string | undefined,
  ) {
    if (!input && !listType) return;
    if (input.trim() === '' || input === '*.') {
      showNotification({
        duration: getSetting(StoreUser.store.getState(), 'notificationOnScreen') as number,
        msg: `${browser.i18n.getMessage('addNewExpressionNotificationFailed')}`,
      });
      return;
    };
    const payload = {
      expression: localFileToRegex(input.trim()),
      listType,
      storeId: parseCookieStoreId(getSetting(StoreUser.store.getState(), 'contextualIdentities') as boolean, cookieStoreId),
    }
    cadLog({
      msg: `background.addNewExpression - Parsed from Right-Click:`,
      x: payload,
    }, getSetting(StoreUser.store.getState(), 'debugMode') as boolean);
    const cache = StoreUser.store.getState().cache;
    showNotification({
      duration: getSetting(StoreUser.store.getState(), 'notificationOnScreen') as number,
      msg: `${browser.i18n.getMessage('addNewExpressionNotification', [payload.expression, payload.listType, `${payload.storeId}${(getSetting(StoreUser.store.getState(), 'contextualIdentities') as boolean) ? (cache[payload.storeId] !== undefined ? ` (${cache[payload.storeId]})` : '') : ''}`])}\n${browser.i18n.getMessage('addNewExpressionNotificationIgnore')}`,
    });
    StoreUser.store.dispatch<any>(addExpressionUI(payload));
  }
}
