import { useId } from "react";

const cupImage = "/assets/copydrink-cup-crayon-black.png";
const nameImage = "/assets/copydrink-wordmark-custom-black.webp";

function LogoPart({ part }: { part: "cup" | "name" }) {
  const filterId = useId();
  const cup = part === "cup";

  return (
    <svg
      className={cup ? "brand-logo-cup" : "brand-logo-name"}
      viewBox={cup ? "0 0 358 436" : "129 122 1959 479"}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id={filterId}
          x="0"
          y="0"
          width="1"
          height="1"
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2126 -0.7152 -0.0722 0 1"
            result="darkPixels"
          />
          <feComponentTransfer in="darkPixels" result="ink">
            <feFuncA type="linear" slope="2" intercept="-0.4" />
          </feComponentTransfer>
          <feFlood floodColor="currentColor" result="brandColor" />
          <feComposite in="brandColor" in2="ink" operator="in" />
        </filter>
      </defs>
      <image
        href={cup ? cupImage : nameImage}
        width={cup ? "358" : "2172"}
        height={cup ? "436" : "724"}
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}

export function BrandLogo() {
  return (
    <>
      <LogoPart part="cup" />
      <LogoPart part="name" />
    </>
  );
}

// Only the stamp rings receive the worn-ink texture; the shared logo stays crisp.
export function StampBorder() {
  const textureId = useId();
  const maskId = useId();

  return (
    <svg
      className="footer-stamp-border"
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={textureId} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.48"
            numOctaves="3"
            seed="12"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  8 0 0 0 -3.1"
          />
        </filter>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="120"
          height="120"
        >
          <rect
            width="120"
            height="120"
            fill="white"
            filter={`url(#${textureId})`}
          />
        </mask>
      </defs>
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        mask={`url(#${maskId})`}
      >
        <circle
          cx="60"
          cy="60"
          r="57.5"
          strokeWidth="2.2"
          strokeDasharray="53 1.6 21 0.9 38 2.2 65 0.8 29 1.4"
        />
        <circle
          cx="60"
          cy="60"
          r="52.5"
          strokeWidth="1.1"
          strokeDasharray="27 1.3 68 0.8 31 2.4 46 1.2"
          strokeDashoffset="18"
        />
      </g>
    </svg>
  );
}
