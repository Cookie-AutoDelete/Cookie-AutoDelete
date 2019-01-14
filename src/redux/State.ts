// tslint:disable:object-literal-sort-keys

export const initialState: State = {
  lists: {},
  cookieDeletedCounterTotal: 0,
  cookieDeletedCounterSession: 0,
  settings: {
    activeMode: {
      name: 'activeMode',
      value: false,
      id: 1,
    },
    delayBeforeClean: {
      name: 'delayBeforeClean',
      value: 15,
      id: 2,
    },
    statLogging: {
      name: 'statLogging',
      value: true,
      id: 3,
    },
    showNumOfCookiesInIcon: {
      name: 'showNumOfCookiesInIcon',
      value: true,
      id: 4,
    },
    showNotificationAfterCleanup: {
      name: 'showNotificationAfterCleanup',
      value: true,
      id: 5,
    },
    cleanCookiesFromOpenTabsOnStartup: {
      name: 'cleanCookiesFromOpenTabsOnStartup',
      value: false,
      id: 6,
    },
    contextualIdentities: {
      name: 'contextualIdentities',
      value: false,
      id: 7,
    },
    localstorageCleanup: {
      name: 'localstorageCleanup',
      value: false,
      id: 8,
    },
    notificationOnScreen: {
      name: 'notificationOnScreen',
      value: 3,
      id: 9,
    },
    domainChangeCleanup: {
      name: 'domainChangeCleanup',
      value: false,
      id: 10,
    },
  },
  activityLog: [],
  cache: {},
};
