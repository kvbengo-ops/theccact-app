// The learning-site addresses are supplied by deployment configuration for both builds and functions.
export function learningOrigin(brand, env = process.env) {
  const value = brand === 'ccact' ? env.LEARN_CCACT_ORIGIN : brand === 'cces' ? env.LEARN_CCES_ORIGIN : '';
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash ? url.origin : null;
  } catch { return null; }
}

export function learningRedirects({ app, origin, pages, existing = '' }) {
  if (app !== 'learn') {
    if (!origin) return existing;
    return `/learn ${origin}/learn/ 302!\n/learn/* ${origin}/learn/:splat 302!\n${existing}`;
  }
  const routes = pages.filter((page) => !page.startsWith('learn/') && page.endsWith('.html'))
    .flatMap((page) => [`/${page} /learn/ 302!`, ...(page.endsWith('/index.html') ? [`/${page.slice(0, -'index.html'.length)} /learn/ 302!`] : [])]);
  return ['/ /learn/ 302!', '/admin /learn/ 302!', '/admin/* /learn/ 302!', ...routes, '/* /learn/ 302', ''].join('\n');
}
