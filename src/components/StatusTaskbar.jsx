import React from "react"

/*
  Phase lifecycle:
  idle       -> nothing running
  analysing  -> first ~2.2-3s after click, always solid amber/yellow
  thinking   -> waiting on the actual API response. Color drifts from
                amber towards red the longer it takes relative to a
                "typical" Gemini response window, so the indicator
                communicates real completion pressure without showing
                any numbers.
  live       -> response has arrived. Green, blinks a few times, then
                settles to a solid glow until the next request starts.

  This panel is always visible (fixed, top-right of the viewport) —
  no hide/show control here by design.
*/

const REFERENCE_START_MS = 2200 // thinking phase kicks in around here
const REFERENCE_END_MS = 9000   // beyond this, we treat it as "slow" and cap at red

function getThinkingColor(elapsedMs) {
  const pct = Math.min(
    1,
    Math.max(0, (elapsedMs - REFERENCE_START_MS) / (REFERENCE_END_MS - REFERENCE_START_MS))
  )
  const hue = 45 - pct * 45 // 45 = amber, 0 = red
  return { color: `hsl(${hue}, 90%, 48%)`, pct }
}

const STATIC_COLORS = {
  idle: "#94a3b8",
  analysing:"hsl(60, 90%, 50%)",
  live: "#22c55e",
}

const LABELS = {
  idle: "Idle",
  analysing: "Analysing",
  thinking: "Thinking",
  live: "Live",
}

export default function StatusTaskbar({ phase, elapsedMs }) {
  const isThinking = phase === "thinking"
  const { color, pct } = isThinking
    ? getThinkingColor(elapsedMs)
    : { color: STATIC_COLORS[phase] || STATIC_COLORS.idle, pct: 0 }

  const label = LABELS[phase] || LABELS.idle
  const dotClass =
    phase === "live"
      ? "status-dot-blink"
      : phase === "analysing" 
      ? "status-dot-pulse"
      : ""

  return (
    <div className={`status-taskbar-fixed status-phase-${phase}`}>
      <span
        className={`status-dot ${dotClass}`}
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="status-label" style={{ color }}>
        {label}
      </span>
      {isThinking && (
        <span className="status-thinking-bar-track">
          <span
            className="status-thinking-bar-fill"
            style={{ width: `${Math.max(8, pct * 100)}%`, backgroundColor: color }}
          />
        </span>
      )}
    </div>
  )
}