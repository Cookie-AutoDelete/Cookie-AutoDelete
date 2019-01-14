// Dynamically generate and append timestamp to download filename
export const exportAppendTimestamp = (element: HTMLElement) => {
  // We take into account the timezone offset since using Date.toISOString() returns in UTC/GMT.
  element.setAttribute(
    'download',
    `CAD_Expressions_${new Date(
      new Date().getTime() - new Date().getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, -5)
      .replace('T', '_')
      .replace(/:/g, '.')}.json`,
  );
};
