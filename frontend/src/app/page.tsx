"use client";

export default function Home() {
  return (
    <main style={{ margin: 0, padding: 0, width: "100%", minHeight: "100dvh", height: "100dvh", overflow: "hidden" }}>
      <iframe
        src="/portal.html"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "100dvh",
          border: "none",
          margin: 0,
          padding: 0,
          display: "block",
        }}
        title="VFSTR Institutional Portal - Agent 43"
      />
    </main>
  );
}
