import React from "react";
import { Composition } from "remotion";
import { Demo } from "./Demo";
import { DemoFull } from "./DemoFull";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DripDemo"
        component={Demo}
        durationInFrames={1350}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DripDemoFull"
        component={DemoFull}
        durationInFrames={5931}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
