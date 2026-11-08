/** Original, self-contained vector art; works offline without remote assets. */
export function Knight() {
  return (
    <svg
      className="knight-art"
      viewBox="0 0 380 260"
      role="img"
      aria-label="A young knight carrying a shield on the path to a castle"
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#e9debf" />
          <stop offset="1" stopColor="#f4ecdc" />
        </linearGradient>
        <linearGradient id="steel" x2="1" y2="1">
          <stop stopColor="#e6e8e8" />
          <stop offset="1" stopColor="#a9b6c3" />
        </linearGradient>
      </defs>
      <circle cx="220" cy="130" r="117" fill="url(#sky)" />
      <circle cx="304" cy="63" r="23" fill="#d5ad55" opacity=".6" />
      <path d="M52 213Q140 144 237 202T371 205V242H52Z" fill="#d5c7ac" />
      <path d="M160 242q70-47 122-62l-8-9q-68 15-144 71" fill="#f4eddf" />
      <g fill="#a89e98">
        <path d="M268 101h66v74h-66z" />
        <path d="M261 81h19v94h-19zM321 81h19v94h-19z" />
        <path d="M257 72h7v12h6V72h7v12h7V72h7v20h-34zM315 72h7v12h6V72h7v12h6V72h7v20h-33z" />
      </g>
      <path d="M293 175v-27a10 10 0 0 1 20 0v27" fill="#6c707c" />
      <path d="M299 62V38" stroke="#777180" strokeWidth="3" />
      <path d="m301 39 26 6-26 9" fill="#a75f4b" />
      <path
        d="m79 217 5-6m246 16 5-6m-21-12 5-5"
        stroke="#b5a38a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="150" cy="235" rx="57" ry="9" fill="#7c7475" opacity=".15" />
      <path d="m145 131-38 91 38-12 21-71" fill="#a75f4b" />
      <path
        d="m143 182-5 42-13 5v8h30l8-50m9-5 8 42 14 5v8h-30l-8-49"
        fill="#39475e"
        stroke="#28374c"
        strokeWidth="3"
      />
      <path
        d="M132 126q26-12 50 0l10 57q-31 18-65 0z"
        fill="url(#steel)"
        stroke="#526077"
        strokeWidth="3"
      />
      <path d="m151 129 7 40 9-40" fill="#d2b16c" />
      <path
        d="M132 132q-19 13-17 39"
        fill="none"
        stroke="#a6b3c3"
        strokeWidth="17"
        strokeLinecap="round"
      />
      <path
        d="M180 134q18 8 24 27"
        fill="none"
        stroke="#a6b3c3"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M130 104V84q0-30 27-30t29 30v21q-28 25-56-1"
        fill="url(#steel)"
        stroke="#526077"
        strokeWidth="3"
      />
      <path d="M129 87h57v21q-28 19-57 0z" fill="#58677c" />
      <path
        d="M141 94v10m10-10v13m11-13v13m11-13v10"
        stroke="#d1d7df"
        strokeWidth="3"
      />
      <path d="M157 55q-1-22 22-28-6 17-22 28" fill="#a75f4b" />
      <path
        d="M115 158 91 171l4 29q5 17 21 24 18-10 23-26l1-26z"
        fill="#33465e"
        stroke="#d7b56b"
        strokeWidth="4"
      />
      <path d="M114 174v30m-11-18h23" stroke="#e5c784" strokeWidth="5" />
      <path
        d="m201 181 29-70 7-9-1 12-25 71"
        fill="#e9ebed"
        stroke="#58677b"
        strokeWidth="2"
      />
      <path
        d="m198 178 18 7m-12 9 5-12"
        stroke="#c09a50"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <g fill="#b79046">
        <path d="m58 94 2 6 6 2-6 2-2 6-2-6-6-2 6-2zM236 35l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        <circle cx="85" cy="142" r="2" />
        <circle cx="348" cy="112" r="2" />
      </g>
    </svg>
  );
}
