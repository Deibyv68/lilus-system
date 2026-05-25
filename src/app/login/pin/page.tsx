import { redirect } from "next/navigation";
import { getCurrentUser, getTrustedDevice } from "@/lib/auth";
import { PinForm } from "./pin-form";

export const dynamic = "force-dynamic";

export default async function LoginPinPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const device = await getTrustedDevice();
  if (!device) {
    redirect("/login");
  }

  return (
    <PinForm
      userName={device.user.name}
      isLocked={!!device.lockedUntil && device.lockedUntil > new Date()}
      lockedUntil={device.lockedUntil?.toISOString() ?? null}
    />
  );
}
