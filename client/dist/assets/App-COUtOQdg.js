const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/AppBody-DmTGb-QR.js","assets/index-DnCVQQRO.js","assets/voice-D-4X00XL.js","assets/api-CXkl7B-R.js","assets/index-DQHligi8.css"])))=>i.map(i=>d[i]);
import { j as jsxRuntimeExports, _ as __vitePreload } from "./index-DnCVQQRO.js";
import { a as reactExports } from "./voice-D-4X00XL.js";
import "./api-CXkl7B-R.js";
const AppBody = reactExports.lazy(() => __vitePreload(() => import("./AppBody-DmTGb-QR.js"), true ? __vite__mapDeps([0,1,2,3,4]) : void 0));
function App() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { padding: "2rem", textAlign: "center" }, children: "Loading…" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppBody, {}) });
}
export {
  App as default
};
