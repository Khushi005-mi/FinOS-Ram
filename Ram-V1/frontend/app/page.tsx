import { redirect } from "next/navigation";

export default function RootPage() {
  // Automatically redirect root route "/" to "/dashboard"
  redirect("/dashboard");
}