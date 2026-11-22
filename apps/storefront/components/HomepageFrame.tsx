"use client";

export default function HomepageFrame() {
  return (
    <iframe
      src="/homepage.html"
      title="OLIVA NATURA"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
        zIndex: 20,
      }}
    />
  );
}
