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

import { cadLog, getSetting } from './Libs';
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
      title: 'Trigger Cleaning',
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
      title: 'Expressions Menu',
    }, ContextMenuEvents.onCreatedOrUpdated);
    // Link Group
    browser.contextMenus.create({
      contexts: ['link'],
      id: ContextMenuEvents.MENUID.PARENT_LINK_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: 'Domain only for the selected link',
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
      title: 'All subdomains with this domain for the selected link',
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
      title: 'Domain only for the selected page',
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
      title: 'All subdomains with this domain for the selected page',
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
      title: 'Domain only for selected text "%s"',
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
      title: 'For all subdomains of the selected text "%s"',
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
    const debug = getSetting(StoreUser.store.getState(), 'debugMode');
    browser.contextMenus.update(id, {
      checked,
    }).catch(this.onCreatedOrUpdated);
    if (debug) {
      cadLog({
        msg: `ContextMenuEvents.updateMenuItemCheckbox: Updated Menu Item.`,
        x: {id, checked},
      });
    }
  }

  public static onCreatedOrUpdated() {
    const debug = getSetting(StoreUser.store.getState(), 'debugMode');
    if (browser.runtime.lastError) {
      if (debug) {
        cadLog({
          msg: `ContextMenuEvents.onCreatedOrUpdated received an error: ${browser.runtime.lastError}`,
        });
      } else {
        console.error(`Error creating or updating menu item:  ${browser.runtime.lastError}`);
      }
    } else {
      if (debug) {
        cadLog({
          msg: `ContextMenuEvents.onCreatedOrUpdated:  Create/Update contextMenuItem was successful.`,
        });
      }
    }
  }
}
