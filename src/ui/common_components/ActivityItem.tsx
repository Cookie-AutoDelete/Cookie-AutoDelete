import { useCallback } from 'react';
import { shallowEqual } from 'react-redux';
import browser from 'webextension-polyfill';
import { removeActivity } from '../../redux/ActivityLogSlice';
import { selectCache } from '../../redux/CacheSlice';
import { selectSettingValues, selectSettings } from '../../redux/SettingsSlice';
import {
  cadLog,
  isFirefox,
  returnOptionalCookieAPIAttributes,
  siteDataToBrowser,
  throwErrorNotification,
} from '../../services/Libs';
import type { ActivityLog } from '../../typings/Cleanup';
import { SettingID, SiteDataType } from '../../typings/Enums';
import { useUIDispatch, useUISelector } from '../hooks';
import ActivityDetailedSummary from './ActivityDetailedSummary';
import IconButton from './IconButton';

export interface ActivityItemProps {
  log: ActivityLog;
  index: number;
}

const createSummary = (cleanupObj: ActivityLog) => {
  const domainSet = new Set<string>();
  Object.values(cleanupObj.storeIds).forEach((value) => {
    value.forEach((deletedLog) => domainSet.add(deletedLog.cookie.hostname));
  });
  if (cleanupObj.browsingDataCleanup) {
    Object.values(cleanupObj.browsingDataCleanup).forEach((sd) => {
      sd && sd.forEach((domain) => domainSet.add(domain));
    });
  }

  return {
    total: domainSet.size.toString(),
    domains: Array.from(domainSet).slice(0, 5).join(', '),
  };
};

function ActivityItem({ log, index }: ActivityItemProps) {
  const summary = createSummary(log);
  const message = browser.i18n.getMessage('notificationContent', [
    log.recentlyCleaned.toString(),
    summary.total,
    summary.domains !== '' ? summary.domains : '(Private)',
  ]);
  const browsingDataEntries = Object.entries(log.browsingDataCleanup || {});
  const storeIdEntries = Object.entries(log.storeIds);

  const dispatch = useUIDispatch();

  const cache = useUISelector(selectCache);
  const settings = useUISelector((state) => {
    return selectSettingValues(
      selectSettings(state),
      SettingID.DEBUG_MODE,
      SettingID.NOTIFY_DURATION,
      SettingID.CONTEXTUAL_IDENTITIES,
    );
  }, shallowEqual);

  const firefox = isFirefox(cache);
  const debug = settings.debugMode as boolean;

  const restoreCookies = useCallback(async () => {
    const cleanReasonObjsArrays = Object.values(log.storeIds);
    const promiseArr: Promise<browser.Cookies.Cookie>[] = [];

    cadLog(
      {
        msg: `ActivityTable.restoreCookies:  Restoring Cookies for triggered ActivityLog entry`,
        x: log,
      },
      debug,
    );

    for (const cleanReasonObjs of cleanReasonObjsArrays) {
      for (const obj of cleanReasonObjs) {
        // Cannot set cookies from file:// protocols
        if (obj.cookie.preparedCookieDomain.startsWith('file:')) {
          cadLog(
            {
              msg: 'Cookie appears to come from a local file.  Cannot be restored normally.',
              type: 'warn',
              x: obj.cookie,
            },
            debug,
          );
          continue;
        }
        // Silently ignore cookies with no domain
        if (obj.cookie.preparedCookieDomain.trim() === '') {
          cadLog(
            {
              msg: 'Cookie appears to have no domain.  Cannot restore.',
              type: 'warn',
              x: obj.cookie,
            },
            debug,
          );
          continue;
        }
        const {
          domain,
          expirationDate,
          firstPartyDomain,
          hostOnly,
          httpOnly,
          name,
          sameSite,
          secure,
          storeId,
          value,
        } = obj.cookie;
        // Prefix fun: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#Cookie_prefixes
        // Since the cookies returned through web-extension API should already be validated,
        // we are not doing any validations for __Secure- cookies.
        // For cookies starting with __Secure-, secure attribute should already be true,
        // and url should already start with https://
        // Only modify cookie names starting with __Host- as it shouldn't have domain.
        const cookieProperties = {
          ...returnOptionalCookieAPIAttributes(firefox, {
            firstPartyDomain,
          }),
          domain: name.startsWith('__Host-') || hostOnly ? undefined : domain,
          expirationDate,
          httpOnly,
          name,
          sameSite,
          secure,
          storeId,
          url: obj.cookie.preparedCookieDomain,
          value,
        };
        promiseArr.push(browser.cookies.set(cookieProperties));
      }
    }

    let someCookiesRestoredFailed = false;

    // Use allSettled to process all regardless of rejection.
    await Promise.allSettled(promiseArr).then((results) => {
      const rejectedResults = results.filter(
        (result) => result.status === 'rejected',
      );
      someCookiesRestoredFailed = rejectedResults.length > 0;

      if (someCookiesRestoredFailed) {
        throwErrorNotification(
          new Error(
            'Error(s) occurred while trying to restore cookie(s). Please check the log for more details.',
          ),
          settings.notificationOnScreen as number,
        );
      }

      rejectedResults.forEach((result) => {
        cadLog(
          {
            msg: 'An Error occurred while trying to restore cookie(s).',
            type: 'error',
            x: result.reason,
          },
          debug,
        );
      });
    });

    // Restore didn't fail
    if (!someCookiesRestoredFailed) {
      dispatch(removeActivity(log));
    }
  }, [debug, dispatch, firefox, log, settings.notificationOnScreen]);

  return (
    <div key={index} className="accordion-item">
      <div
        className="accordion-header d-flex justify-content-between align-items-center p-2"
        id={`heading${index}`}
      >
        {(log.recentlyCleaned > 0 && (
          <IconButton
            className={'btn-primary fa-width-auto'}
            iconName={'undo'}
            onClick={() => restoreCookies()}
            title={browser.i18n.getMessage('restoreText')}
          />
        )) ?? <div className={'ms-auto'} style={{ minWidth: '42px' }} />}
        <button
          className="btn btn-link text-wrap collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={`#collapse${index}`}
          aria-expanded="false"
          aria-controls={`collapse${index}`}
        >
          {`${new Date(log.dateTime).toLocaleString([], {
            timeZoneName: 'short',
          })} - ${message} ...`}
        </button>
        <IconButton
          className={'btn-outline-danger fa-width-auto'}
          iconName={'trash'}
          onClick={() => dispatch(removeActivity(log))}
          title={browser.i18n.getMessage('removeActivityLogEntryText')}
        />
      </div>
      <div
        id={`collapse${index}`}
        className="collapse"
        aria-labelledby={`heading${index}`}
        data-parent="#accordion"
      >
        {browsingDataEntries.map(([siteData, domains]) => {
          if (!domains || domains.length === 0) return '';
          return (
            <div
              key={`${siteData}-${log.dateTime}`}
              className={`alert alert-info mx-2`}
              role="alert"
            >
              {browser.i18n.getMessage('activityLogSiteDataDomainsText', [
                browser.i18n.getMessage(
                  `${siteDataToBrowser(siteData as SiteDataType)}Text`,
                ),
                domains.join(', '),
              ])}
            </div>
          );
        })}
        {storeIdEntries.map(([storeId, cleanReasonObjects]) => {
          return (
            <div key={`${storeId}-${log.dateTime}`}>
              {(storeIdEntries.length > 1 || settings.contextualIdentities) && (
                <h6>
                  {cache[storeId] !== undefined ? `${cache[storeId]} ` : ''}
                  {storeId}
                </h6>
              )}
              <ActivityDetailedSummary
                cleanReasonObjects={cleanReasonObjects}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityItem;
