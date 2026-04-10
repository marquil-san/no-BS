import type { BackgroundConfig } from "@/hooks/useSettings";

interface BackgroundLayerProps {
  background: BackgroundConfig;
}

export default function BackgroundLayer({ background }: BackgroundLayerProps) {
  if (background.type === "none") return null;

  if (background.type === "color") {
    return (
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ backgroundColor: background.value, zIndex: 0 }}
      />
    );
  }

  if (background.type === "image" && background.value) {
    return (
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${background.value})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />
    );
  }

  if (background.type === "video" && background.value) {
    return (
      <video
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
        src={background.value}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  return null;
}
