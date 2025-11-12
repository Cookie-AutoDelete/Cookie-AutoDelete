import type { CleanReasonObject } from '../../typings/Cleanup';
import { ReasonClean, ReasonKeep, ListType } from '../../typings/Enums';
import browser from 'webextension-polyfill';

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

export interface ActivityItemProps {
  cleanReasonObjects: CleanReasonObject[];
}

function ActivityItem({ cleanReasonObjects }: ActivityItemProps) {
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
          className={`alert alert-danger mx-2`}
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
}

export default ActivityItem;
