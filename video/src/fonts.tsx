import React from "react";
import { staticFile } from "remotion";

export const FONT_SANS = "Inter";
export const FONT_MONO = "JetBrains Mono";

/** Injects local @font-face rules so every render tab uses cached fonts (no per-tab network). */
export const FontStyles: React.FC = () => (
  <style>
    {`@font-face{font-family:'Inter';src:url('${staticFile("fonts/Inter.ttf")}') format('truetype');font-weight:100 900;font-display:block}
      @font-face{font-family:'JetBrains Mono';src:url('${staticFile("fonts/JetBrainsMono.ttf")}') format('truetype');font-weight:100 800;font-display:block}`}
  </style>
);
