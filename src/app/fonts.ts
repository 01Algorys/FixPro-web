// Fonts are bundled from npm (@fontsource) instead of next/font/google, so builds never
// download from Google Fonts (a failed download there broke the Hostinger build).
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/cairo';
import '@fontsource/caveat/700.css';

// Same shape as next/font objects, so call sites keep using `font.className` (classes in globals.css)
export const jakarta = { className: 'font-jakarta' };
export const cairo = { className: 'font-cairo' };
export const caveat = { className: 'font-caveat' };
