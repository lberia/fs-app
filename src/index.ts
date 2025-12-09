import index from "./index.html";
import { serve } from "bun";
import { apiRoutes } from "./server/routes";

serve({
  routes: {
    "/*": index,
    ...apiRoutes,
  },
  ...(process.env.NODE_ENV === "development"
    ? { development: { hmr: false } }
    : {}),
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});
