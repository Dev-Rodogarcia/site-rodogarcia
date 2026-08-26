import { redirect } from "next/navigation";

export default function HomeHeroRedirectPage() {
  redirect("/developer/home#hero");
}
