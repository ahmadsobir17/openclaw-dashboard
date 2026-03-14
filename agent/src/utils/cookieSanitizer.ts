/**
 * Sanitizes cookies for Playwright compatibility
 * Playwright only accepts sameSite values: 'Strict' | 'Lax' | 'None'
 * Browser exports may contain: 'unspecified', 'no_restriction', 'lax', 'none', etc.
 */
export function sanitizeCookiesForPlaywright(cookies: any[]): any[] {
  return cookies.map(cookie => {
    const sanitized: any = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
    };

    if (cookie.httpOnly !== undefined) sanitized.httpOnly = cookie.httpOnly;
    if (cookie.secure !== undefined) sanitized.secure = cookie.secure;

    // Sanitize sameSite
    if (cookie.sameSite !== undefined) {
      const ss = cookie.sameSite;
      if (ss === 'lax' || ss === 'Lax') {
        sanitized.sameSite = 'Lax';
      } else if (ss === 'no_restriction' || ss === 'None' || ss === 'none') {
        sanitized.sameSite = 'None';
      } else if (ss === 'strict' || ss === 'Strict') {
        sanitized.sameSite = 'Strict';
      } else {
        // For 'unspecified' or unknown values, omit sameSite (use Playwright's default)
        // Do not set sameSite property
      }
    }

    // Convert expirationDate to expires
    if (cookie.expirationDate !== undefined) {
      sanitized.expires = cookie.expirationDate;
    }

    return sanitized;
  });
}
