import { redirect } from "next/navigation";
import { admin } from "@/lib/routes";

export default function CadastrarUsuarioPage() {
  redirect(admin.users);
}
