"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Power,
  KeyRound,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  createUserAction,
  toggleUserActiveAction,
  resetPasswordAction,
  deleteUserAction,
} from "./actions";

type User = {
  id: string;
  username: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  deviceCount: number;
};

export function UsersAdmin({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" /> Nuevo usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {users.length} usuario{users.length === 1 ? "" : "s"} registrado
            {users.length === 1 ? "" : "s"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y -mx-2">
            {users.map((u) => {
              const isMe = u.id === currentUserId;
              return (
                <li
                  key={u.id}
                  className="px-2 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight flex items-center gap-2">
                      {u.name}
                      {isMe && (
                        <Badge variant="outline" className="text-[10px]">
                          Tú
                        </Badge>
                      )}
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {u.role === "admin" ? "Admin" : "Usuario"}
                      </Badge>
                      {!u.isActive && (
                        <Badge variant="destructive" className="text-[10px]">
                          Inactivo
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {u.username}
                      {u.deviceCount > 0 && (
                        <span className="ml-2">
                          · {u.deviceCount} dispositivo
                          {u.deviceCount === 1 ? "" : "s"} confiable
                          {u.deviceCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setResetUser(u)}
                      title="Cambiar contraseña"
                    >
                      <KeyRound className="size-4" />
                    </Button>
                    {!isMe && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              await toggleUserActiveAction(u.id);
                              toast.success(
                                u.isActive
                                  ? `${u.name} desactivado`
                                  : `${u.name} reactivado`
                              );
                              router.refresh();
                            } catch (e) {
                              toast.error((e as Error).message);
                            }
                          })
                        }
                        title={u.isActive ? "Desactivar" : "Reactivar"}
                        disabled={isPending}
                      >
                        <Power
                          className={`size-4 ${u.isActive ? "" : "text-muted-foreground"}`}
                        />
                      </Button>
                    )}
                    {!isMe && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteUser(u)}
                        title="Eliminar"
                        className="text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => router.refresh()}
      />

      {resetUser && (
        <ResetPasswordDialog
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSaved={() => {
            setResetUser(null);
            router.refresh();
          }}
        />
      )}

      {deleteUser && (
        <DeleteUserDialog
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onDeleted={() => {
            setDeleteUser(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");

  function reset() {
    setUsername("");
    setName("");
    setPassword("");
    setRole("user");
  }

  function submit() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("username", username);
      fd.set("name", name);
      fd.set("password", password);
      fd.set("role", role);
      const res = await createUserAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Usuario creado");
      reset();
      onOpenChange(false);
      onCreated();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>
            Datos para que esta persona pueda acceder al sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Nombre completo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="María García"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Usuario (login)</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="maria"
              autoCapitalize="none"
              className="h-11 font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Letras, números, punto o guion. 3-40 caracteres.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Contraseña inicial</Label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Rol</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "user" | "admin")}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuario — acceso normal</SelectItem>
                <SelectItem value="admin">
                  Admin — puede gestionar usuarios
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Creando…" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (password.length < 6) {
      toast.error("Mínimo 6 caracteres");
      return;
    }
    startTransition(async () => {
      const res = await resetPasswordAction(user.id, password);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Contraseña de ${user.name} actualizada`);
      onSaved();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Vas a cambiar la contraseña de <strong>{user.name}</strong>. Sus
            sesiones activas se cerrarán automáticamente.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nueva contraseña"
          className="h-11"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Guardando…" : "Actualizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: User;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Eliminar usuario
          </DialogTitle>
          <DialogDescription>
            ¿Eliminar a <strong>{user.name}</strong>? Esta acción no se puede
            deshacer. Sus sesiones y dispositivos confiables se borran también.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                try {
                  await deleteUserAction(user.id);
                  toast.success("Usuario eliminado");
                  onDeleted();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              })
            }
            disabled={isPending}
          >
            <Trash2 className="size-4" />
            {isPending ? "Eliminando…" : "Sí, eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
