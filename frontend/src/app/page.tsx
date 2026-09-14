"use client";

export default function Home() {
  return (
    <main style={{ margin: 0, padding: 0, width: "100vw", height: "100vh", overflow: "hidden" }}>
      <iframe
        src="/portal.html"
        style={{
          width: "100%",
          height: "100%",
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
