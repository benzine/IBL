"use client";

import type { SVGProps } from "react";

/**
 * The official IBL mark, redrawn as React SVG from the group's own logo file
 * (iblgroup.com/storage/2025/10/IBL-logo.svg). The geometry is exact, including
 * the TOGETHER wordmark. Only the ink is re-graded: the letters follow
 * currentColor so the lockup prints navy on paper, glows light in the abyss and
 * warms to sepia ink on parchment, while the square carries the live grade teal
 * (deep teal pressed into paper, luminous teal on the dark grades).
 *
 * Rendered decorative by default; pass a label to make it a named image.
 */
export function IblOfficialMark({
  className,
  wordmark = true,
  label,
  ...rest
}: SVGProps<SVGSVGElement> & { wordmark?: boolean; label?: string }) {
  return (
    <svg
      viewBox="0 0 99.205 67.949"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      focusable="false"
      {...rest}
    >
      {/* the B and the L, exact paths from the official file */}
      <g fill="currentColor">
        <path d="M44.629,39.539H28.7V30.912c4.061-1.241,9.067-1.534,15.928-1.183,3.219.167,5.175,1.985,5.38,4.88.2,2.749-2.36,4.931-5.38,4.931m9.56-16.407c2.4-2.589,4.387-5.337,4.387-9.622C58.576,6.605,52.533,0,43.419,0H18.249V21.016A35.206,35.206,0,0,1,28.7,17.369V10.117H43.293A4.8,4.8,0,0,1,48,15a4.8,4.8,0,0,1-4.711,4.88H37.229c-10.411,0-19.493,3.057-27.111,12.007V13.792H0V49.6H10.118a92.772,92.772,0,0,1,8.128-11.567V49.6H44.629c8.892,0,16.09-6.219,16.09-14.993a12.645,12.645,0,0,0-6.53-11.476" />
        <g transform="translate(35.751 -0.001)">
          <path d="M39.752,39.526V0H29.3V49.6H63.453V39.526Z" />
        </g>
      </g>
      {/* the tone-on-tone accent the original file carries inside the B,
          a whisper of darker ink over the letterform in every grade */}
      <g transform="translate(10.029 16.988)">
        <path d="M8.219,21.045v1.989c5.693-6.094,10.346-5.408,10.455-5.388V13.923A21.875,21.875,0,0,0,8.219,21.045" fill="#000" opacity="0.3" />
      </g>
      {/* the square, pressed into paper or luminous on the abyss */}
      <rect width="11" height="11" style={{ fill: "var(--ibl-teal)" }} />
      {wordmark && (
        <g fill="currentColor" opacity="0.92">
          <g transform="translate(0.001 32.82)">
            <path d="M3.567,28.139v6.872H2.183V28.139H0V26.9H5.749v1.241Z" />
          </g>
          <g transform="translate(3.746 32.755)">
            <path d="M4.524,30.959c0,1.67.311,3.077,2.076,3.077s2.076-1.408,2.076-3.077S8.365,28.013,6.6,28.013s-2.076,1.277-2.076,2.946m-1.454,0c0-2.278.715-4.114,3.53-4.114s3.53,1.836,3.53,4.114c0,2.3-.715,4.234-3.53,4.234s-3.53-1.932-3.53-4.234" />
          </g>
          <g transform="translate(8.402 32.755)">
            <path d="M6.886,30.959c0-2.278.715-4.114,3.53-4.114a9.371,9.371,0,0,1,2.815.428l-.311,1.17a9.154,9.154,0,0,0-2.4-.36c-1.694,0-2.185,1.206-2.185,2.875,0,1.789.491,2.993,2.185,2.993a2.936,2.936,0,0,0,1.323-.309v-1.6H10.441v-1.23h2.791V34.6a7.346,7.346,0,0,1-2.815.6c-2.815,0-3.53-1.907-3.53-4.234" />
          </g>
          <g transform="translate(12.868 32.82)">
            <path d="M15.876,28.139H11.929v2.051h3.41v1.241h-3.41V33.77h4.007v1.241H10.545V26.9h5.331Z" />
          </g>
          <g transform="translate(16.555 32.82)">
            <path d="M17.133,28.139v6.872H15.75V28.139H13.567V26.9h5.748v1.241Z" />
          </g>
          <g transform="translate(20.487 32.821)">
            <path d="M16.79,35.009V26.9h1.383v3.293h3.459V26.9h1.383v8.11H21.632V31.43H18.173v3.579Z" />
          </g>
          <g transform="translate(24.914 32.82)">
            <path d="M25.749,28.139H21.8v2.051h3.41v1.241H21.8V33.77h4.007v1.241H20.418V26.9h5.331Z" />
          </g>
          <g transform="translate(28.722 32.821)">
            <path d="M24.922,30.751h1.814a1.215,1.215,0,0,0,1.37-1.312,1.2,1.2,0,0,0-1.323-1.3H24.922Zm3.268,4.258-1.814-3.031H24.922v3.031H23.539V26.9h3.4a2.387,2.387,0,0,1,2.589,2.54,2.217,2.217,0,0,1-1.705,2.327L29.8,35.009Z" />
          </g>
        </g>
      )}
    </svg>
  );
}
