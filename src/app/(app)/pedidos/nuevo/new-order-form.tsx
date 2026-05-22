"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createOrderAction } from "../actions";
import { formatCurrency } from "@/lib/format";
import { Plus, Minus, Trash2, ShoppingCart, Package, Boxes, UserCheck } from "lucide-react";
import { CustomerSearch, type FoundCustomer } from "./customer-search";

type Item = {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl?: string | null;
};
type Zone = { id: string; name: string };
type Carrier = { id: string; name: string };
type Rate = { zoneId: string; carrierId: string; price: number };

type CartLine = {
  kind: "product" | "pack";
  refId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
};

export function NewOrderForm({
  products,
  packs,
  zones,
  carriers,
  rates,
}: {
  products: Item[];
  packs: Item[];
  zones: Zone[];
  carriers: Carrier[];
  rates: Rate[];
}) {
  const [isPending, startTransition] = useTransition();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");

  const [customer, setCustomer] = useState({
    name: "",
    cedula: "",
    phone: "",
    email: "",
  });
  const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(null);

  function handleCustomerSelect(c: FoundCustomer) {
    setLinkedCustomerId(c.id);
    setCustomer({
      name: c.name,
      cedula: c.cedula ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
    });
    if (c.lastAddress) {
      setAddress({
        province: c.lastAddress.province,
        city: c.lastAddress.city,
        address: c.lastAddress.address,
        reference: c.lastAddress.reference ?? "",
        zoneId: c.lastAddress.zoneId ?? zones[0]?.id ?? "",
      });
    }
    toast.success(`Datos cargados de ${c.name}`);
  }

  function clearLinkedCustomer() {
    setLinkedCustomerId(null);
    setCustomer({ name: "", cedula: "", phone: "", email: "" });
  }
  const [address, setAddress] = useState({
    province: "Pichincha",
    city: "Quito",
    address: "",
    reference: "",
    zoneId: zones.find((z) => z.name === "Quito")?.id ?? zones[0]?.id ?? "",
  });
  const [carrierId, setCarrierId] = useState(carriers[0]?.id ?? "");
  const [shippingOverride, setShippingOverride] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("");

  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPacks = packs.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(kind: "product" | "pack", it: Item) {
    setCart((prev) => {
      const existing = prev.find((c) => c.kind === kind && c.refId === it.id);
      if (existing) {
        return prev.map((c) =>
          c.kind === kind && c.refId === it.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [
        ...prev,
        { kind, refId: it.id, name: it.name, sku: it.sku, price: it.price, quantity: 1 },
      ];
    });
  }
  function changeQty(idx: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c, i) => (i === idx ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c))
        .filter((c) => c.quantity > 0)
    );
  }
  function removeLine(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const matchingRate = rates.find(
    (r) => r.zoneId === address.zoneId && r.carrierId === carrierId
  );
  const autoShipping = matchingRate?.price ?? 0;
  const shipping =
    shippingOverride !== ""
      ? parseFloat(shippingOverride) || 0
      : autoShipping;
  const total = subtotal + shipping;

  function submit() {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    if (!customer.name.trim()) {
      toast.error("Nombre del cliente requerido");
      return;
    }
    if (!address.address.trim() || !address.city.trim() || !address.province.trim()) {
      toast.error("Dirección, ciudad y provincia son obligatorias");
      return;
    }
    if (!address.zoneId) {
      toast.error("Selecciona zona de envío");
      return;
    }
    if (!carrierId) {
      toast.error("Selecciona transportadora");
      return;
    }

    startTransition(async () => {
      const res = await createOrderAction({
        customer,
        address,
        carrierId,
        shippingCost: shipping,
        notes,
        source,
        items: cart.map((c) => ({ kind: c.kind, refId: c.refId, quantity: c.quantity })),
      });
      if (res && !res.ok) {
        toast.error(res.error ?? "Error al crear pedido");
      }
      // si todo va bien, el server redirige
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
      {/* Catálogo + cliente */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="size-5" />
              Catálogo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre o SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4"
            />
            <Tabs defaultValue={packs.length > 0 ? "packs" : "products"}>
              <TabsList>
                <TabsTrigger value="products">
                  <Package className="size-4 mr-1" /> Productos ({filteredProducts.length})
                </TabsTrigger>
                <TabsTrigger value="packs">
                  <Boxes className="size-4 mr-1" /> Packs ({filteredPacks.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="products">
                <CatalogGrid items={filteredProducts} onAdd={(it) => addToCart("product", it)} />
              </TabsContent>
              <TabsContent value="packs">
                <CatalogGrid items={filteredPacks} onAdd={(it) => addToCart("pack", it)} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Datos del cliente</span>
              {linkedCustomerId && (
                <button
                  type="button"
                  onClick={clearLinkedCustomer}
                  className="text-xs font-normal text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <UserCheck className="size-3.5 text-green-600" />
                  Cliente existente · cambiar
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomerSearch onSelect={handleCustomerSelect} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre completo" required>
              <Input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              />
            </Field>
            <Field label="Cédula / RUC">
              <Input
                value={customer.cedula}
                onChange={(e) => setCustomer({ ...customer, cedula: e.target.value })}
              />
            </Field>
            <Field label="Teléfono">
              <Input
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              />
            </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Envío</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Provincia" required>
                <Input
                  value={address.province}
                  onChange={(e) => setAddress({ ...address, province: e.target.value })}
                />
              </Field>
              <Field label="Ciudad" required>
                <Input
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Dirección" required>
              <Input
                value={address.address}
                onChange={(e) => setAddress({ ...address, address: e.target.value })}
                placeholder="Calle, número, sector"
              />
            </Field>
            <Field label="Referencia">
              <Input
                value={address.reference}
                onChange={(e) => setAddress({ ...address, reference: e.target.value })}
                placeholder="Casa esquinera, junto a…"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Zona" required>
                <Select
                  value={address.zoneId}
                  onValueChange={(v) => setAddress({ ...address, zoneId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={z.id}>
                        {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Transportadora" required>
                <Select value={carrierId} onValueChange={setCarrierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field
              label={`Costo de envío (auto: ${formatCurrency(autoShipping)})`}
              hint="Deja vacío para usar la tarifa configurada, o escribe un valor para sobrescribir."
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder={autoShipping.toFixed(2)}
                value={shippingOverride}
                onChange={(e) => setShippingOverride(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Origen del pedido">
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="WhatsApp, Instagram…"
                />
              </Field>
            </div>
            <Field label="Notas">
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
      </div>

      {/* Carrito sticky */}
      <div>
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Resumen del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Agrega productos o packs desde el catálogo.
              </p>
            ) : (
              <ul className="divide-y -mx-2">
                {cart.map((line, idx) => (
                  <li key={idx} className="px-2 py-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{line.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {line.sku}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {line.kind === "pack" ? "Pack" : "Producto"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-7"
                          onClick={() => changeQty(idx, -1)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums">
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="size-7"
                          onClick={() => changeQty(idx, 1)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7 ml-1"
                          onClick={() => removeLine(idx)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                      <span className="tabular-nums">
                        {formatCurrency(line.price * line.quantity)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t pt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(subtotal)} />
              <Row label="Envío" value={formatCurrency(shipping)} />
              <Row label="Total" value={formatCurrency(total)} strong />
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={submit}
              disabled={isPending}
            >
              {isPending ? "Creando pedido…" : "Crear pedido"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CatalogGrid({
  items,
  onAdd,
}: {
  items: Item[];
  onAdd: (it: Item) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Sin resultados.</p>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onAdd(it)}
          className="text-left border rounded-lg p-2 hover:bg-accent transition-colors"
        >
          <div className="relative aspect-square w-full rounded bg-muted mb-2 overflow-hidden">
            {it.imageUrl && (
              <Image
                src={it.imageUrl}
                alt={it.name}
                fill
                className="object-cover"
                sizes="160px"
              />
            )}
          </div>
          <p className="text-xs font-medium line-clamp-2 leading-tight">{it.name}</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{it.sku}</p>
          <p className="text-sm font-semibold mt-1 tabular-nums">
            {formatCurrency(it.price)}
          </p>
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${
        strong ? "font-bold text-base pt-2 border-t" : ""
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
