var page = browser.extension.getBackgroundPage().exposedFunctions;
document.getElementById("tabWelcomeText").textContent = browser.i18n.getMessage("welcomeText");
document.getElementById("tabSettingsText").textContent = browser.i18n.getMessage("settingsText");
document.getElementById("tabWhiteListText").textContent = browser.i18n.getMessage("whiteListText");
document.getElementById("tabAboutText").textContent = browser.i18n.getMessage("aboutText");


document.getElementById("sectionWelcome").textContent = browser.i18n.getMessage("welcomeText");
document.getElementById("welcomeMessage").textContent = browser.i18n.getMessage("welcomeMessage",[page.statLog.cookieDeletedCounter, page.statLog.cookieDeletedCounterTotal]);
document.getElementById("reviewLinkMessage").textContent = browser.i18n.getMessage("reviewLinkMessage");
document.getElementById("releaseNotesText").textContent = browser.i18n.getMessage("releaseNotesText");

document.getElementById("sectionSettings").textContent = browser.i18n.getMessage("settingsText");
document.getElementById("activeModeText").textContent = browser.i18n.getMessage("activeModeText");
document.getElementById("minutesText").textContent = browser.i18n.getMessage("minutesText");
document.getElementById("activeModeTooltipText").textContent = browser.i18n.getMessage("activeModeTooltipText");
document.getElementById("statLoggingText").textContent = browser.i18n.getMessage("statLoggingText");
document.getElementById("statLoggingTooltipText").textContent = browser.i18n.getMessage("statLoggingTooltipText");
document.getElementById("resetCounterText").textContent = browser.i18n.getMessage("resetCounterText");
document.getElementById("showNumberOfCookiesInIconText").textContent = browser.i18n.getMessage("showNumberOfCookiesInIconText");
document.getElementById("showNumberOfCookiesInIconTooltipText").textContent = browser.i18n.getMessage("showNumberOfCookiesInIconTooltipText");
document.getElementById("notifyCookieCleanUpText").textContent = browser.i18n.getMessage("notifyCookieCleanUpText");
document.getElementById("notifyCookieCleanUpTooltipText").textContent = browser.i18n.getMessage("notifyCookieCleanUpTooltipText");

document.getElementById("cookieCleanUpOnStartText").textContent = browser.i18n.getMessage("cookieCleanUpOnStartText");
document.getElementById("cookieCleanUpOnStartTooltipText").textContent = browser.i18n.getMessage("cookieCleanUpOnStartTooltipText");
document.getElementById("enableGlobalSubdomainText").textContent = browser.i18n.getMessage("enableGlobalSubdomainText");
document.getElementById("enableGlobalSubdomainTooltipText").textContent = browser.i18n.getMessage("enableGlobalSubdomainTooltipText");

document.getElementById("contextualIdentitiesEnabledText").textContent = browser.i18n.getMessage("contextualIdentitiesEnabledText");
document.getElementById("contextualIdentitiesTooltipText").textContent = browser.i18n.getMessage("contextualIdentitiesTooltipText");
document.getElementById("saveText").textContent = browser.i18n.getMessage("saveText");
document.getElementById("cancelText").textContent = browser.i18n.getMessage("cancelText");
document.getElementById("defaultSettingsText").textContent = browser.i18n.getMessage("defaultSettingsText");
document.getElementById("defaultSettingsTooltipText").textContent = browser.i18n.getMessage("defaultSettingsTooltipText");
document.getElementById("saveConfirmText").textContent = browser.i18n.getMessage("saveConfirmText");
document.getElementById("cancelConfirmText").textContent = browser.i18n.getMessage("cancelConfirmText");
document.getElementById("defaultConfirmText").textContent = browser.i18n.getMessage("defaultConfirmText");
document.getElementById("resetCounterConfirmText").textContent = browser.i18n.getMessage("resetCounterConfirmText");



document.getElementById("sectionWhiteList").textContent = browser.i18n.getMessage("whiteListText");
document.getElementById("addURLText").textContent = browser.i18n.getMessage("addURLText");
document.getElementById("clearURLText").textContent = browser.i18n.getMessage("clearURLText");
document.getElementById("dropbtnId").textContent = `${browser.i18n.getMessage("toWhiteListText")} \u25BC`;
document.getElementById("dropdownText").textContent = browser.i18n.getMessage("greyListWordText");
document.getElementById("enterURLTooltipText").textContent = browser.i18n.getMessage("enterURLTooltipText");
document.getElementById("hoverButtonTooltipText").textContent = browser.i18n.getMessage("hoverButtonTooltipText");
document.getElementById("exportURLSText").textContent = browser.i18n.getMessage("exportURLSText");
document.getElementById("importURLSText").textContent = browser.i18n.getMessage("importURLSText");

document.getElementById("sectionAbout").textContent = browser.i18n.getMessage("aboutText");
document.getElementById("reportIssuesText").textContent = browser.i18n.getMessage("reportIssuesText");
document.getElementById("chromeVersionText").textContent = browser.i18n.getMessage("versionText");
document.getElementById("firefoxVersionText").textContent = browser.i18n.getMessage("versionText");
document.getElementById("contributorsText").textContent = browser.i18n.getMessage("contributorsText");