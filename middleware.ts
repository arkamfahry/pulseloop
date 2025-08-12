import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const publicRoutes = createRouteMatcher(["/", "/signin", "/signup"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (await convexAuth.isAuthenticated()) {
    if (publicRoutes(request) && request.nextUrl.pathname === "/signin") {
      return nextjsMiddlewareRedirect(request, "/");
    }
    return;
  }

  if (!publicRoutes(request)) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
