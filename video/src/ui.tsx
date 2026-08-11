import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { C } from "./theme";

const inter = loadInter();
const mono = loadMono();

export const FONT_SANS = inter.fontFamily;
export const FONT_MONO = mono.fontFamily;

export const DripLogo: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <path d="M16 4 C22 10 24 13 24 17 a8 8 0 1 1 -16 0 C8 13 10 10 16 4 Z" fill={C.acid} />
    <rect x="14.5" y="21" width="3" height="6" fill={C.paper} />
  </svg>
);

export const Grid: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage: `repeating-linear-gradient(0deg, rgba(215,255,63,0.035) 0 1px, transparent 1px 72px),
        repeating-linear-gradient(90deg, rgba(215,255,63,0.035) 0 1px, transparent 1px 72px)`,
    }}
  />
);

export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; y?: number }> = ({
  children,
  delay = 0,
  y = 24,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200, stiffness: 200, mass: 0.8 } });
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity, transform: `translateY(${(1 - s) * y}px)` }}>{children}</div>
  );
};

export const Count: React.FC<{
  to: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  ease?: boolean;
}> = ({ to, start = 0, duration = 40, decimals = 2, prefix = "", suffix = "", ease = true }) => {
  const frame = useCurrentFrame();
  const p = ease
    ? interpolate(frame, [start, start + duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })
    : interpolate(frame, [start, start + duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const v = to * p;
  return (
    <span>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export const Panel: React.FC<{
  title?: string;
  right?: string;
  children: React.ReactNode;
  width?: number | string;
  accent?: boolean;
}> = ({ title, right, children, width, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200, stiffness: 180, mass: 0.9 } });
  return (
    <div
      style={{
        width,
        transform: `scale(${0.96 + 0.04 * s})`,
        border: `1px solid ${accent ? C.acid : C.border}`,
        background: C.panel,
        boxShadow: accent ? `0 0 60px rgba(215,255,63,0.08)` : undefined,
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${C.border}`,
            padding: "12px 18px",
            background: accent ? C.acid : C.panel2,
          }}
        >
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: accent ? C.bg : C.paper,
            }}
          >
            {title}
          </span>
          {right && (
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: accent ? C.bg : C.muted }}>
              {right}
            </span>
          )}
        </div>
      )}
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
};

export const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; weight?: number }> = ({
  children,
  size = 15,
  color = C.paper,
  weight = 400,
}) => (
  <span style={{ fontFamily: FONT_MONO, fontSize: size, color, fontWeight: weight }}>{children}</span>
);

export const Chip: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.acid }) => (
  <span
    style={{
      fontFamily: FONT_MONO,
      fontSize: 12,
      letterSpacing: 1,
      color: color === C.acid ? C.bg : color,
      background: color === C.acid ? C.acid : "transparent",
      border: `1px solid ${color === C.acid ? C.acid : C.border}`,
      padding: "5px 10px",
    }}
  >
    {children}
  </span>
);

export const Arrow: React.FC<{ label?: string }> = ({ label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "0 10px" }}>
    <div style={{ fontFamily: FONT_MONO, fontSize: 26, color: C.acid }}>→</div>
    {label && <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.muted }}>{label}</div>}
  </div>
);

export const Bar: React.FC<{ progress: number; height?: number; color?: string }> = ({
  progress,
  height = 14,
  color = C.acid,
}) => (
  <div style={{ width: "100%", height, background: C.panel2, border: `1px solid ${C.border}` }}>
    <div
      style={{
        width: `${Math.max(0, Math.min(100, progress * 100))}%`,
        height: "100%",
        background: color,
        transition: "none",
      }}
    />
  </div>
);
