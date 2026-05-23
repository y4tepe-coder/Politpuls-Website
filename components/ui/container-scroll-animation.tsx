"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <PhoneCard rotate={rotate} translate={translate} scale={scale}>
          {children}
        </PhoneCard>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

/**
 * Phone-Frame statt breitem Bild — visualisiert das iPhone-first-Design
 * von Politpuls. Innen lebt das echte Spiel (iframe auf /play).
 */
export const PhoneCard = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="relative mx-auto -mt-12 w-[320px] md:w-[380px] h-[650px] md:h-[760px] rounded-[60px] bg-[#1F1D17] p-3 border-[6px] border-[#2A2620]"
    >
      {/* Side buttons */}
      <span aria-hidden className="absolute -left-[3px] top-[110px] w-[3px] h-8 rounded-l-sm bg-[#2A2620]" />
      <span aria-hidden className="absolute -left-[3px] top-[160px] w-[3px] h-14 rounded-l-sm bg-[#2A2620]" />
      <span aria-hidden className="absolute -left-[3px] top-[220px] w-[3px] h-14 rounded-l-sm bg-[#2A2620]" />
      <span aria-hidden className="absolute -right-[3px] top-[170px] w-[3px] h-20 rounded-r-sm bg-[#2A2620]" />

      {/* Inner screen */}
      <div className="relative h-full w-full overflow-hidden rounded-[48px] bg-[#FBF6E9]">
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[100px] h-[28px] rounded-full bg-[#0A0908]" />
        {children}
      </div>
    </motion.div>
  );
};
