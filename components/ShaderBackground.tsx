"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ShaderBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <ShaderGradientCanvas
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
      lazyLoad={false}
    >
      <ShaderGradient
        control="props"
        animate="on"
        type="waterPlane"
        uTime={0}
        uSpeed={0.2}
        uStrength={1.5}
        uDensity={1.5}
        uFrequency={5.5}
        uAmplitude={0}
        positionX={0}
        positionY={0}
        positionZ={0}
        rotationX={50}
        rotationY={0}
        rotationZ={-60}
        color1={isDark ? "#1e1b4b" : "#c7d2fe"}
        color2={isDark ? "#6d28d9" : "#a78bfa"}
        color3={isDark ? "#312e81" : "#f0abfc"}
        reflection={0.1}
        wireframe={false}
        shader="defaults"
        cAzimuthAngle={180}
        cPolarAngle={80}
        cDistance={2.8}
        cameraZoom={9.1}
        lightType="3d"
        brightness={isDark ? 0.8 : 1.2}
        envPreset="city"
        grain="on"
        toggleAxis={false}
        zoomOut={false}
        hoverState=""
        enableTransition={false}
      />
    </ShaderGradientCanvas>
  );
}
