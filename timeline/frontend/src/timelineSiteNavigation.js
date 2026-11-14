const GRID_PARENT_PAGES = [
  { label: 'Home', path: '/index.html' },
  { label: 'About Us', path: '/aboutus.html' },
  { label: 'Meet the Team', path: '/team.html' },
  { label: 'Timeline', current: true },
  { label: 'FAQs', path: '/FAQ/FAQ.html' },
  { label: 'Contact Us', path: '/ContactUs.html' },
];

export function createTimelineSiteNavigation(parentUrl = '', timelineUrl = '/') {
  const parentBase = parentUrl.trim();

  return GRID_PARENT_PAGES.map((item) => {
    if (item.current) return { ...item, href: timelineUrl, disabled: false };

    const href = parentBase
      ? new URL(item.path, `${parentBase.replace(/\/+$/, '')}/`).href
      : item.path;

    return { ...item, href, disabled: !parentBase };
  });
}
