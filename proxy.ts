import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // Allow everything for now to stop the redirect loop during session transition
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
