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
    EXPRESSION_ADD_GREY_DOMAIN: "cad-expression-add-grey-domain",
    EXPRESSION_ADD_GREY_SUBS: "cad-expression-add-grey-subs",
    EXPRESSION_ADD_WHITE_DOMAIN: "cad-expression-add-white-domain",
    EXPRESSION_ADD_WHITE_SUBS: "cad-expression-add-white-subs",
    EXPRESSION_DOMAIN: "cad-expression-domain",
    EXPRESSION_STATUS: "cad-expression-status",
    EXPRESSION_SUBS: "cad-expression-subs",
    PARENT_CLEAN: "cad-parent-clean",
    PARENT_EXPRESSION: "cad-parent-expression",
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
    });
    // Regular Clean (exclude open tabs)
    browser.contextMenus.create({
      id: ContextMenuEvents.MENUID.CLEAN,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('cleanText'),
    });
    // Clean (include open tabs)
    browser.contextMenus.create({
      id: ContextMenuEvents.MENUID.CLEAN_OPEN,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('cleanIgnoringOpenTabsText'),
    });
    // Separator
    browser.contextMenus.create({
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      type: "separator",
    });
    // Cleanup Warning
    browser.contextMenus.create({
      enabled: false,
      id: 'cad-clean-warn',
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('cleanupActionsBypass'),
    });
    // Clean cookies for domain
    browser.contextMenus.create({
      id: ContextMenuEvents.MENUID.CLEAN_COOKIES,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('clearSiteDataText', ['cookies']),
    });
    // Clean localstorage for domain
    browser.contextMenus.create({
      id: ContextMenuEvents.MENUID.CLEAN_LOCALSTORAGE,
      parentId: ContextMenuEvents.MENUID.PARENT_CLEAN,
      title: browser.i18n.getMessage('clearSiteDataText', ['localstorage']),
    });
    // Separator
    browser.contextMenus.create({
      contexts: defaultContexts,
      type: "separator",
    });
    // Add Expression Option Group - page
    browser.contextMenus.create({
      contexts: ['link', 'page', 'selection'],
      id: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: 'Expressions Menu',
    });
    // Domain
    browser.contextMenus.create({
      contexts: ['link'],
      enabled: false,
      id: `${ContextMenuEvents.MENUID.EXPRESSION_DOMAIN}-link`,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: 'For the selected link',
    });
    browser.contextMenus.create({
      contexts: ['page'],
      enabled: false,
      id: `${ContextMenuEvents.MENUID.EXPRESSION_DOMAIN}-page`,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: 'For domain on active Tab/Page',
    });
    browser.contextMenus.create({
      contexts: ['selection'],
      enabled: false,
      id: `${ContextMenuEvents.MENUID.EXPRESSION_DOMAIN}-selection`,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: 'For selected text: %s',
    });
    // Separator
    browser.contextMenus.create({
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      type: "separator",
    });
    // Add to Greylist Domain
    browser.contextMenus.create({
      id: ContextMenuEvents.MENUID.EXPRESSION_ADD_GREY_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: browser.i18n.getMessage('toGreyListText'),
    });
    // Add to Whitelist Domain
    browser.contextMenus.create({
      id: ContextMenuEvents.MENUID.EXPRESSION_ADD_WHITE_DOMAIN,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: browser.i18n.getMessage('toWhiteListText'),
    });
    // Separator
    browser.contextMenus.create({
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      type: "separator",
    });
    // Subdomain
    browser.contextMenus.create({
      contexts: ['link'],
      enabled: false,
      id: `${ContextMenuEvents.MENUID.EXPRESSION_SUBS}-link`,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: 'For all subdomains of the selected link',
    });
    browser.contextMenus.create({
      contexts: ['page'],
      enabled: false,
      id: `${ContextMenuEvents.MENUID.EXPRESSION_SUBS}-page`,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: 'For all subdomains of the domain on active tab/page',
    });
    browser.contextMenus.create({
      contexts: ['selection'],
      enabled: false,
      id: `${ContextMenuEvents.MENUID.EXPRESSION_SUBS}-selection`,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: 'For all subdomains of the selected text: %s',
    });
    // Separator
    browser.contextMenus.create({
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      type: "separator",
    });
    // Add to Whitelist Subdomains
    browser.contextMenus.create({
      id: ContextMenuEvents.MENUID.EXPRESSION_ADD_GREY_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: browser.i18n.getMessage('toGreyListText'),
    });
    // Add to Whitelist Subdomains
    browser.contextMenus.create({
      id: ContextMenuEvents.MENUID.EXPRESSION_ADD_WHITE_SUBS,
      parentId: ContextMenuEvents.MENUID.PARENT_EXPRESSION,
      title: browser.i18n.getMessage('toWhiteListText'),
    });
    // Separator
    browser.contextMenus.create({
      contexts: defaultContexts,
      type: "separator",
    });
    // Active Mode
    browser.contextMenus.create({
      checked: state.settings.activeMode.value as boolean,
      contexts: defaultContexts,
      id: ContextMenuEvents.MENUID.ACTIVE_MODE,
      title: browser.i18n.getMessage('activeModeText'),
      type: "checkbox",
    });
    // CAD Settings Page.  Opens in a new tab next to the current one.
    browser.contextMenus.create({
      contexts: defaultContexts,
      id: ContextMenuEvents.MENUID.SETTINGS,
      title: browser.i18n.getMessage('settingsText'),
    });
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
          msg: `ContextMenuEvents.onCreatedOrUpdated:  Create/Update ContextMenu was successful.`,
        });
      }
    }
  }
}
