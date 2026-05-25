import { redirect } from "next/navigation";
import { getCurrentUser, getTrustedDevice } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Si ya hay sesión, ir directo al dashboard
  const user = await getCurrentUser();
  if (user) redirect("/");

  // Si el dispositivo es de confianza y tiene PIN, ofrecer login por PIN
  const device = await getTrustedDevice();
  if (device) {
    redirect("/login/pin");
  }

  return <LoginForm />;
}
