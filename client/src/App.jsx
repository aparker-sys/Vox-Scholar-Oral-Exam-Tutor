import { lazy, Suspense } from "react";

const AppBody = lazy(() => import("./AppBody.jsx"));

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>}>
      <AppBody />
    </Suspense>
  );
}
