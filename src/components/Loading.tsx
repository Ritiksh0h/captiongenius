import React from "react";
import { TypeAnimation } from "react-type-animation";

// Replaces the @nextui-org/react Progress with a plain Tailwind indeterminate bar.
// Props preserved for backward-compat; progressColor/value are unused (always indeterminate).
const Loading = ({
  textColor,
  sequence,
}: {
  textColor: string;
  value?: number;
  progressColor?: string;
  sequence: (string | number)[];
}) => {
  return (
    <div className="fixed w-screen h-screen z-20 inset-0 flex items-center justify-center overflow-hidden backdrop-filter backdrop-blur-sm bg-black/40">
      <div className="w-64 space-y-3">
        {/* Indeterminate progress bar */}
        <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-lime animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>
        <p className={`text-${textColor} font-bold text-xl`}>
          Please wait,{" "}
          <TypeAnimation
            sequence={sequence}
            wrapper="span"
            repeat={Infinity}
          />
        </p>
      </div>
    </div>
  );
};

export default Loading;
