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
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { removeActivity } from '../../redux/Actions';
import {
  cadLog,
  getSetting,
  returnOptionalCookieAPIAttributes,
  siteDataToBrowser,
  throwErrorNotification,
} from '../../services/Libs';
import { FilterOptions } from '../../typings/Enums';
import { ReduxAction } from '../../typings/ReduxConstants';
import IconButton from './IconButton';

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

const createDetailedSummary = (cleanReasonObjects: CleanReasonObject[]) => {
  const mapDomainToCookieNames: { [domain: string]: CleanReasonObject[] } = {};
  cleanReasonObjects.forEach((obj) => {
    if (mapDomainToCookieNames[obj.cookie.hostname]) {
      mapDomainToCookieNames[obj.cookie.hostname].push(obj);
    } else {
      mapDomainToCookieNames[obj.cookie.hostname] = [obj];
    }
  });
  return Object.entries(mapDomainToCookieNames).map(
    ([domain, cleanReasonObj]) => {
      return (
        <div
          style={{
            marginLeft: '10px',
          }}
          className={`alert alert-danger`}
          key={`${domain}`}
          role="alert"
        >
          {`${domain} (${cleanReasonObj
            .map((obj) => obj.cookie.name)
            .join(', ')}): ${returnReasonMessages(cleanReasonObj[0])}`}
        </div>
      );
    },
  );
};

const returnReasonMessages = (cleanReasonObject: CleanReasonObject) => {
  const { reason } = cleanReasonObject;
  const { hostname, mainDomain } = cleanReasonObject.cookie;
  const matchedExpression = cleanReasonObject.expression;
  switch (reason) {
    case ReasonClean.CADSiteDataCookie:
    case ReasonClean.ExpiredCookie: {
      return browser.i18n.getMessage(reason, [hostname]);
    }
    case ReasonKeep.OpenTabs: {
      return browser.i18n.getMessage(reason, [mainDomain]);
    }

    case ReasonClean.NoMatchedExpression:
    case ReasonClean.StartupNoMatchedExpression: {
      return browser.i18n.getMessage(reason, [hostname]);
    }

    case ReasonClean.StartupCleanupAndGreyList: {
      return browser.i18n.getMessage(reason, [
        matchedExpression ? matchedExpression.expression : '',
      ]);
    }

    case ReasonClean.MatchedExpressionButNoCookieName:
    case ReasonKeep.MatchedExpression: {
      return browser.i18n.getMessage(reason, [
        matchedExpression ? matchedExpression.expression : '',
        matchedExpression && matchedExpression.listType === ListType.GREY
          ? browser.i18n.getMessage('greyListWordText')
          : browser.i18n.getMessage('whiteListWordText'),
      ]);
    }

    default:
      return '';
  }
};

type ActivityAction = (log: ActivityLog) => void;

interface StateProps {
  activityLog: ReadonlyArray<ActivityLog>;
  cache: CacheMap;
  state: State;
}

interface DispatchProps {
  onRemoveActivity: ActivityAction;
}

interface OwnProps {
  decisionFilter: FilterOptions;
  numberToShow?: number;
}

type ActivityTableProps = OwnProps & StateProps & DispatchProps;

const restoreCookies = async (
  state: State,
  log: ActivityLog,
  onRemoveActivity: ActivityAction,
) => {
  const debug = getSetting(state, SettingID.DEBUG_MODE) as boolean;
  const cleanReasonObjsArrays = Object.values(log.storeIds);
  const promiseArr = [];
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
            msg:
              'Cookie appears to come from a local file.  Cannot be restored normally.',
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
        ...returnOptionalCookieAPIAttributes(state, {
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
  try {
    // If any error/rejection was thrown, the rest of the promises are not processed.
    // FUTURE:  Use https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled to process all regardless of rejection. ** Perhaps too early to implement at this time 2020-May-03 **
    await Promise.all(promiseArr).catch((e) => {
      throwErrorNotification(
        e,
        getSetting(state, SettingID.NOTIFY_DURATION) as number,
      );
      cadLog(
        {
          msg:
            'An Error occurred while trying to restore cookie(s).  The rest of the cookies to restore are not processed.',
          type: 'error',
          x: e,
        },
        debug,
      );
      throw e;
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return;
  }
  // Restore didn't fail
  onRemoveActivity(log);
};

const ActivityTable: React.FunctionComponent<ActivityTableProps> = (props) => {
  const { activityLog, cache, numberToShow, state, onRemoveActivity } = props;
  if (props.activityLog.length === 0) {
    return (
      <div className="alert alert-primary" role="alert">
        <i>
          {browser.i18n.getMessage('noCleanupLogText')}
          <br /> {browser.i18n.getMessage('noPrivateLogging')}
        </i>
      </div>
    );
  }
  const filtered = activityLog.slice(0, numberToShow || 10);
  return (
    <div
      className="accordion"
      id="accordion"
      style={{
        marginBottom: '10px',
      }}
    >
      {filtered.map((log, index) => {
        const summary = createSummary(log);
        const message = browser.i18n.getMessage('notificationContent', [
          log.recentlyCleaned.toString(),
          summary.total,
          summary.domains !== '' ? summary.domains : '(Private)',
        ]);
        const browsingDataEntries = Object.entries(
          log.browsingDataCleanup || {},
        );
        const storeIdEntries = Object.entries(log.storeIds);
        return (
          <div key={index} className="card">
            <div
              style={{ display: 'flex' }}
              className="card-header"
              id={`heading${index}`}
            >
              {(log.recentlyCleaned > 0 && (
                <IconButton
                  className={'btn-primary mr-auto'}
                  iconName={'undo'}
                  onClick={() => restoreCookies(state, log, onRemoveActivity)}
                  title={browser.i18n.getMessage('restoreText')}
                />
              )) || <div className={'mr-auto'} style={{ minWidth: '42px' }} />}
              <h5
                className="mb-0"
                style={{
                  overflowX: 'hidden',
                }}
              >
                <button
                  className="btn btn-link collapsed"
                  type="button"
                  data-toggle="collapse"
                  data-target={`#collapse${index}`}
                  aria-expanded="false"
                  aria-controls={`collapse${index}`}
                >
                  {`${new Date(log.dateTime).toLocaleString([], {
                    timeZoneName: 'short',
                  })} - ${message} ...`}
                </button>
              </h5>
              <IconButton
                className={'btn-outline-danger ml-auto'}
                iconName={'trash'}
                onClick={() => onRemoveActivity(log)}
                title={browser.i18n.getMessage('removeActivityLogEntryText')}
              />
            </div>
            <div
              id={`collapse${index}`}
              className="collapse"
              aria-labelledby={`heading${index}`}
              data-parent="#accordion"
            >
              <div className="card-body">
                {browsingDataEntries.map(([siteData, domains]) => {
                  if (!domains || domains.length === 0) return '';
                  return (
                    <div
                      key={`${siteData}-${log.dateTime}`}
                      style={{
                        marginLeft: '10px',
                      }}
                      className={`alert alert-info`}
                      role="alert"
                    >
                      {browser.i18n.getMessage(
                        'activityLogSiteDataDomainsText',
                        [
                          browser.i18n.getMessage(
                            `${siteDataToBrowser(
                              siteData as SiteDataType,
                            )}Text`,
                          ),
                          domains.join(', '),
                        ],
                      )}
                    </div>
                  );
                })}
                {storeIdEntries.map(([storeId, cleanReasonObjects]) => {
                  return (
                    <div key={`${storeId}-${log.dateTime}`}>
                      {(storeIdEntries.length > 1 ||
                        getSetting(state, SettingID.CONTEXTUAL_IDENTITIES)) && (
                        <h6>
                          {cache[storeId] !== undefined
                            ? `${cache[storeId]} `
                            : ''}
                          ({storeId})
                        </h6>
                      )}
                      {createDetailedSummary(cleanReasonObjects)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const mapStateToProps = (state: State) => {
  const { activityLog, cache } = state;
  return {
    activityLog,
    cache,
    state,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<ReduxAction>) => ({
  onRemoveActivity(activity: ActivityLog) {
    dispatch(removeActivity(activity));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ActivityTable);
