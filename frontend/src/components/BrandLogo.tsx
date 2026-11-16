import { useId } from "react";

const image = "/assets/copydrink-logo-short-black.webp";

function LogoPart({ part }: { part: "cup" | "name" }) {
  const filterId = useId();
  const cup = part === "cup";

  return (
    <svg
      className={cup ? "brand-logo-cup" : "brand-logo-name"}
      viewBox={cup ? "475 110 580 540" : "245 685 1050 235"}
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
            <feFuncA type="linear" slope="1.5" intercept="-0.1" />
          </feComponentTransfer>
          <feFlood floodColor="currentColor" result="brandColor" />
          <feComposite in="brandColor" in2="ink" operator="in" />
        </filter>
      </defs>
      <image
        href={image}
        width="1536"
        height="1024"
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
