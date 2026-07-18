import { redirect } from "next/navigation";

export default function AdminRoot() {
  // The layout's own auth guard bounces unauthenticated visitors to
  // /admin/login from here — this route itself is the "Overview dashboard"
  // entry point per the requested nav structure.
  redirect("/admin/dashboard");
}
