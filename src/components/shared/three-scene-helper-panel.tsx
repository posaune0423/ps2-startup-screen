"use client";

import { Html, Line } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React from "react";

export const SHOW_THREE_SCENE_HELPER =
  import.meta.env.VITE_THREE_SCENE_HELPER === "1" || import.meta.env.VITE_AUDIO_CD_GRID_HELPER === "1";

const PANEL_STYLE = {
  background: "rgba(205, 209, 214, 0.82)",
  border: "1px solid rgba(82, 90, 102, 0.35)",
  borderRadius: "10px",
  boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
  height: "min(220px, 34vw)",
  left: "20px",
  overflow: "hidden",
  pointerEvents: "none",
  position: "absolute",
  width: "min(220px, 34vw)",
  zIndex: 40,
} as const satisfies React.CSSProperties;

const PLANE_ROTATIONS = {
  xy: [Math.PI / 2, 0, 0],
  xz: [0, 0, 0],
  yz: [0, 0, Math.PI / 2],
} as const;
const PLANE_AXES = {
  xy: ["x", "y"],
  xz: ["x", "z"],
  yz: ["y", "z"],
} as const;
const PLANE_NORMALS = {
  xy: [0, 0, 1],
  xz: [0, 1, 0],
  yz: [1, 0, 0],
} as const;
const AXIS_COLORS = {
  x: "#FF5A5A",
  y: "#61D96B",
  z: "#4F7DFF",
} as const;
const AXIS_ORDER = ["x", "y", "z"] as const;
const AXIS_VECTORS = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
} as const;
const AXIS_GUIDE_LENGTH = 0.82;
const AXIS_GUIDE_LIFT = 0.18;
const AXIS_LABEL_OFFSET = 0.42;
const AXIS_LEGEND_STYLE = {
  background: "rgba(11, 14, 20, 0.52)",
  border: "1px solid rgba(217, 222, 230, 0.38)",
  borderRadius: "8px",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.2)",
  color: "#F4F7FB",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "8px 10px",
  position: "absolute",
  right: "10px",
  top: "10px",
  zIndex: 2,
} as const satisfies React.CSSProperties;
const AXIS_LEGEND_ROW_STYLE = {
  alignItems: "center",
  display: "flex",
  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  fontSize: "12px",
  fontWeight: 700,
  gap: "7px",
  letterSpacing: "0.08em",
  lineHeight: 1,
  textTransform: "uppercase",
} as const satisfies React.CSSProperties;
const AXIS_LEGEND_SWATCH_STYLE = {
  borderRadius: "999px",
  display: "inline-block",
  flex: "0 0 auto",
  height: "3px",
  width: "20px",
} as const satisfies React.CSSProperties;

type Axis = keyof typeof AXIS_COLORS;
type Plane = keyof typeof PLANE_ROTATIONS;
type Vec3 = [number, number, number];

const ZERO_VECTOR: Vec3 = [0, 0, 0];

interface ThreeSceneHelperPanelProps {
  axesSize?: number;
  cameraPosition?: [number, number, number];
  cameraUp?: [number, number, number];
  children?: React.ReactNode;
  divisions?: number;
  lookAt?: [number, number, number];
  panelStyle?: React.CSSProperties;
  plane?: keyof typeof PLANE_ROTATIONS;
  size?: number;
}

function addVectors(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scaleVector(vector: readonly number[], scalar: number): Vec3 {
  return [vector[0] * scalar, vector[1] * scalar, vector[2] * scalar];
}

function AxisLabel({
  axis,
  color,
  position,
}: {
  axis: "x" | "y" | "z";
  color: string;
  position: [number, number, number];
}) {
  return (
    <Html center distanceFactor={8} position={position} sprite transform>
      <div
        style={{
          background: "rgba(7, 10, 14, 0.64)",
          border: `1px solid ${color}66`,
          borderRadius: "999px",
          color,
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: "15px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          lineHeight: 1,
          padding: "2px 8px",
          pointerEvents: "none",
          textShadow: "0 0 8px rgba(255,255,255,0.2)",
          textTransform: "uppercase",
          userSelect: "none",
        }}
      >
        {axis}
      </div>
    </Html>
  );
}

function AxisGuide({ axis, axesSize, plane }: { axis: Axis; axesSize: number; plane: Plane }) {
  const inPlaneAxes = PLANE_AXES[plane];
  const planeNormal = PLANE_NORMALS[plane];
  const axisVector = AXIS_VECTORS[axis];
  const isInPlane = inPlaneAxes.some((candidate) => candidate === axis);
  const guideLift = isInPlane ? scaleVector(planeNormal, AXIS_GUIDE_LIFT) : ZERO_VECTOR;
  const start = guideLift;
  const end = addVectors(scaleVector(axisVector, axesSize * AXIS_GUIDE_LENGTH), guideLift);
  const labelPosition = addVectors(
    scaleVector(axisVector, axesSize * 0.92),
    addVectors(guideLift, scaleVector(planeNormal, AXIS_LABEL_OFFSET)),
  );
  const color = AXIS_COLORS[axis];

  return (
    <>
      <Line color={color} depthTest={false} lineWidth={2.4} points={[start, end]} renderOrder={8} />
      <AxisLabel axis={axis} color={color} position={labelPosition} />
    </>
  );
}

function AxisLegend() {
  return (
    <div style={AXIS_LEGEND_STYLE}>
      {AXIS_ORDER.map((axis) => {
        const color = AXIS_COLORS[axis];

        return (
          <div key={axis} style={AXIS_LEGEND_ROW_STYLE}>
            <span style={{ ...AXIS_LEGEND_SWATCH_STYLE, background: color }} />
            <span style={{ color }}>{axis}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ThreeSceneHelperPanel({
  axesSize: explicitAxesSize,
  cameraPosition = [5.6, 4.6, 7.4],
  cameraUp = [0, 1, 0],
  children,
  divisions = 12,
  lookAt = [0, 0, 0],
  panelStyle,
  plane = "xz",
  size = 12,
}: ThreeSceneHelperPanelProps) {
  if (!SHOW_THREE_SCENE_HELPER) return null;

  const axesSize = explicitAxesSize ?? size / 2;

  return (
    <div aria-hidden="true" style={{ ...PANEL_STYLE, bottom: "20px", ...panelStyle }}>
      <Canvas
        camera={{ fov: 34, position: cameraPosition }}
        dpr={1}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ camera, scene }) => {
          camera.up.set(...cameraUp);
          camera.lookAt(...lookAt);
          scene.background = null;
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight intensity={1.4} position={[4, 7, 5]} />
        <gridHelper args={[size, divisions, "#D9DEE6", "#D9DEE6"]} rotation={PLANE_ROTATIONS[plane]} />
        <axesHelper args={[axesSize]} />
        <AxisGuide axis="x" axesSize={axesSize} plane={plane} />
        <AxisGuide axis="y" axesSize={axesSize} plane={plane} />
        <AxisGuide axis="z" axesSize={axesSize} plane={plane} />
        {children}
      </Canvas>
      <AxisLegend />
    </div>
  );
}
