"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
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
import { useRouter } from "next/navigation";
import { createOrderAction } from "../actions";
import { formatCurrency } from "@/lib/format";
import {
  Plus,
  Minus,
  Trash2,
  Package,
  Boxes,
  ArrowRight,
  ArrowLeft,
  Check,
  ShoppingBag,
  User,
  Truck,
  UserCheck,
  Search,
  Printer,
} from "lucide-react";
import { CustomerSearch, type FoundCustomer } from "./customer-search";
import { PrintStepWizard } from "./print-step-wizard";

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

const STEPS = [
  { id: 1, label: "Productos", icon: ShoppingBag },
  { id: 2, label: "Cliente", icon: User },
  { id: 3, label: "Envío", icon: Truck },
  { id: 4, label: "Confirmar", icon: Check },
  { id: 5, label: "Imprimir", icon: Printer },
];

export function NewOrderForm({
  products,
  packs,
  zones,
  carriers,
  rates,
  agentEnabled,
}: {
  products: Item[];
  packs: Item[];
  zones: Zone[];
  carriers: Carrier[];
  rates: Rate[];
  agentEnabled: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Una vez creado, guardamos el orden para el paso 5
  const [createdOrder, setCreatedOrder] = useState<{
    id: string;
    orderNumber: string;
    productionUnits: { id: string; productName: string; batchCode: string }[];
    packCount: number;
  } | null>(null);

  // ──── State ────
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState({
    name: "",
    cedula: "",
    phone: "",
    email: "",
  });
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

  // ──── Derivados ────
  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPacks = packs.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())
  );

  const subtotal = useMemo(
    () => cart.reduce((s, c) => s + c.price * c.quantity, 0),
    [cart]
  );
  const itemCount = useMemo(
    () => cart.reduce((s, c) => s + c.quantity, 0),
    [cart]
  );
  const matchingRate = rates.find(
    (r) => r.zoneId === address.zoneId && r.carrierId === carrierId
  );
  const autoShipping = matchingRate?.price ?? 0;
  const shipping =
    shippingOverride !== "" ? parseFloat(shippingOverride) || 0 : autoShipping;
  const total = subtotal + shipping;

  // ──── Acciones carrito ────
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
        {
          kind,
          refId: it.id,
          name: it.name,
          sku: it.sku,
          price: it.price,
          quantity: 1,
        },
      ];
    });
  }
  function changeQty(idx: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c, i) =>
          i === idx ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }
  function removeLine(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  // ──── Acciones cliente ────
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

  // ──── Validación por paso ────
  function canAdvanceFrom(s: number): { ok: boolean; reason?: string } {
    if (s === 1)
      return cart.length === 0
        ? { ok: false, reason: "Agrega al menos un producto" }
        : { ok: true };
    if (s === 2)
      return !customer.name.trim()
        ? { ok: false, reason: "El nombre del cliente es obligatorio" }
        : { ok: true };
    if (s === 3) {
      if (!address.address.trim()) return { ok: false, reason: "Falta la dirección" };
      if (!address.city.trim()) return { ok: false, reason: "Falta la ciudad" };
      if (!address.province.trim()) return { ok: false, reason: "Falta la provincia" };
      if (!address.zoneId) return { ok: false, reason: "Selecciona zona" };
      if (!carrierId) return { ok: false, reason: "Selecciona transportadora" };
      return { ok: true };
    }
    return { ok: true };
  }

  function goNext() {
    const v = canAdvanceFrom(step);
    if (!v.ok) {
      toast.error(v.reason ?? "Revisa los datos");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goPrev() {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ──── Submit ────
  function submit() {
    // Re-validar todo
    for (let s = 1; s <= 3; s++) {
      const v = canAdvanceFrom(s);
      if (!v.ok) {
        setStep(s);
        toast.error(v.reason ?? "Revisa los datos");
        return;
      }
    }
    startTransition(async () => {
      const res = await createOrderAction({
        customer,
        address,
        carrierId,
        shippingCost: shipping,
        notes,
        source,
        items: cart.map((c) => ({
          kind: c.kind,
          refId: c.refId,
          quantity: c.quantity,
        })),
      });
      if (!res.ok) {
        toast.error(res.error ?? "Error al crear pedido");
        return;
      }
      // Cargamos los datos del pedido creado para alimentar el paso 5
      try {
        const detailRes = await fetch(`/api/orders/${res.orderId}/summary`);
        if (!detailRes.ok) throw new Error("No se pudo cargar el resumen");
        const data = (await detailRes.json()) as {
          orderNumber: string;
          productionUnits: { id: string; productName: string; batchCode: string }[];
          packCount: number;
        };
        setCreatedOrder({
          id: res.orderId,
          orderNumber: data.orderNumber,
          productionUnits: data.productionUnits,
          packCount: data.packCount,
        });
        setStep(5);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.success("Pedido creado");
      } catch (e) {
        // Si falla el resumen, vamos directo al detalle
        toast.success("Pedido creado");
        router.push(`/pedidos/${res.orderId}`);
      }
    });
  }

  return (
    <div className="pb-32">
      {/* Indicador de progreso */}
      <StepIndicator current={step} />

      {/* Contenido del paso */}
      <div className="mt-6">
        {step === 1 && (
          <StepProducts
            products={filteredProducts}
            packs={filteredPacks}
            allProducts={products}
            allPacks={packs}
            search={search}
            onSearch={setSearch}
            cart={cart}
            onAdd={addToCart}
            onChangeQty={changeQty}
            onRemove={removeLine}
            subtotal={subtotal}
          />
        )}

        {step === 2 && (
          <StepCustomer
            customer={customer}
            setCustomer={setCustomer}
            linkedCustomerId={linkedCustomerId}
            onSelectCustomer={handleCustomerSelect}
            onClearCustomer={clearLinkedCustomer}
          />
        )}

        {step === 3 && (
          <StepShipping
            address={address}
            setAddress={setAddress}
            zones={zones}
            carriers={carriers}
            carrierId={carrierId}
            setCarrierId={setCarrierId}
            autoShipping={autoShipping}
            shippingOverride={shippingOverride}
            setShippingOverride={setShippingOverride}
            notes={notes}
            setNotes={setNotes}
            source={source}
            setSource={setSource}
          />
        )}

        {step === 4 && (
          <StepReview
            cart={cart}
            customer={customer}
            address={address}
            zoneName={zones.find((z) => z.id === address.zoneId)?.name ?? ""}
            carrierName={carriers.find((c) => c.id === carrierId)?.name ?? ""}
            subtotal={subtotal}
            shipping={shipping}
            total={total}
            notes={notes}
            source={source}
            onJump={setStep}
          />
        )}

        {step === 5 && createdOrder && (
          <PrintStepWizard
            orderId={createdOrder.id}
            orderNumber={createdOrder.orderNumber}
            productionUnits={createdOrder.productionUnits}
            packCount={createdOrder.packCount}
            agentEnabled={agentEnabled}
            onFinish={() => router.push(`/pedidos/${createdOrder.id}`)}
          />
        )}
      </div>

      {/* Barra inferior fija — solo se muestra durante los pasos 1-4.
          El paso 5 (centro de impresión) tiene su propia navegación interna. */}
      {step < 5 && (
        <BottomNav
          step={step}
          total={total}
          itemCount={itemCount}
          isPending={isPending}
          onPrev={goPrev}
          onNext={goNext}
          onSubmit={submit}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Indicador de progreso
// ════════════════════════════════════════════════════════
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between gap-1 sm:gap-2">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const isActive = s.id === current;
        const isDone = s.id < current;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={`flex items-center justify-center size-9 sm:size-10 rounded-full border-2 transition-all
                  ${isActive ? "border-primary bg-primary text-primary-foreground scale-110 shadow-md" : ""}
                  ${isDone ? "border-primary bg-primary text-primary-foreground" : ""}
                  ${!isActive && !isDone ? "border-muted bg-background text-muted-foreground" : ""}
                `}
              >
                {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
              </div>
              <span
                className={`text-[10px] sm:text-xs mt-1.5 font-medium truncate
                  ${isActive ? "text-foreground" : "text-muted-foreground"}
                `}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mb-5 transition-colors
                  ${s.id < current ? "bg-primary" : "bg-muted"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Paso 1: Productos
// ════════════════════════════════════════════════════════
function StepProducts({
  products,
  packs,
  allProducts,
  allPacks,
  search,
  onSearch,
  cart,
  onAdd,
  onChangeQty,
  onRemove,
  subtotal,
}: {
  products: Item[];
  packs: Item[];
  allProducts: Item[];
  allPacks: Item[];
  search: string;
  onSearch: (v: string) => void;
  cart: CartLine[];
  onAdd: (kind: "product" | "pack", it: Item) => void;
  onChangeQty: (idx: number, delta: number) => void;
  onRemove: (idx: number) => void;
  subtotal: number;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">¿Qué lleva el pedido?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Toca un producto o pack para agregarlo. Toca varias veces para sumar
          unidades.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o SKU…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9 h-12 text-base"
        />
      </div>

      <Tabs defaultValue={allPacks.length > 0 ? "packs" : "products"}>
        <TabsList className="w-full grid grid-cols-2 h-11">
          <TabsTrigger value="packs" className="text-sm">
            <Boxes className="size-4 mr-1.5" /> Packs ({packs.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="text-sm">
            <Package className="size-4 mr-1.5" /> Productos ({products.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packs" className="mt-4">
          <CatalogGrid
            items={packs}
            cart={cart}
            kind="pack"
            onAdd={(it) => onAdd("pack", it)}
          />
        </TabsContent>
        <TabsContent value="products" className="mt-4">
          <CatalogGrid
            items={products}
            cart={cart}
            kind="product"
            onAdd={(it) => onAdd("product", it)}
          />
        </TabsContent>
      </Tabs>

      {cart.length > 0 && (
        <Card className="border-primary/40">
          <CardContent className="pt-6 space-y-2">
            <h3 className="font-semibold flex items-center justify-between">
              <span>Carrito</span>
              <span className="text-sm font-normal text-muted-foreground">
                {cart.reduce((s, c) => s + c.quantity, 0)} unidades
              </span>
            </h3>
            <ul className="divide-y -mx-2">
              {cart.map((line, idx) => (
                <li key={idx} className="px-2 py-3 text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{line.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(line.price)} c/u
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums shrink-0">
                      {formatCurrency(line.price * line.quantity)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-9"
                        onClick={() => onChangeQty(idx, -1)}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold tabular-nums">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-9"
                        onClick={() => onChangeQty(idx, 1)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-9 text-destructive"
                      onClick={() => onRemove(idx)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CatalogGrid({
  items,
  cart,
  kind,
  onAdd,
}: {
  items: Item[];
  cart: CartLine[];
  kind: "product" | "pack";
  onAdd: (it: Item) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Sin resultados.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((it) => {
        const inCart = cart.find((c) => c.kind === kind && c.refId === it.id);
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onAdd(it)}
            className={`text-left border-2 rounded-xl p-2 transition-all active:scale-95
              ${inCart ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}
            `}
          >
            <div className="relative aspect-square w-full rounded-lg bg-muted mb-2 overflow-hidden">
              {it.imageUrl && (
                <Image
                  src={it.imageUrl}
                  alt={it.name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              )}
              {inCart && (
                <div className="absolute top-1.5 right-1.5 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md">
                  {inCart.quantity}
                </div>
              )}
            </div>
            <p className="text-xs font-semibold line-clamp-2 leading-tight">
              {it.name}
            </p>
            <p className="text-sm font-bold mt-1 tabular-nums">
              {formatCurrency(it.price)}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Paso 2: Cliente
// ════════════════════════════════════════════════════════
function StepCustomer({
  customer,
  setCustomer,
  linkedCustomerId,
  onSelectCustomer,
  onClearCustomer,
}: {
  customer: { name: string; cedula: string; phone: string; email: string };
  setCustomer: (c: {
    name: string;
    cedula: string;
    phone: string;
    email: string;
  }) => void;
  linkedCustomerId: string | null;
  onSelectCustomer: (c: FoundCustomer) => void;
  onClearCustomer: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">¿Quién compra?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Busca un cliente que ya pidió antes, o ingresa uno nuevo.
        </p>
      </div>

      <CustomerSearch onSelect={onSelectCustomer} />

      {linkedCustomerId && (
        <div className="rounded-lg border border-green-600/40 bg-green-50 dark:bg-green-950/30 p-3 text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <UserCheck className="size-4 text-green-600 shrink-0" />
            <span className="text-foreground">Cliente existente vinculado</span>
          </span>
          <button
            type="button"
            onClick={onClearCustomer}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Cambiar
          </button>
        </div>
      )}

      <div className="space-y-4">
        <BigField label="Nombre completo" required>
          <Input
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="Ej: María García"
            className="h-12 text-base"
          />
        </BigField>
        <BigField label="Teléfono">
          <Input
            type="tel"
            inputMode="numeric"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            placeholder="0999999999"
            className="h-12 text-base"
          />
        </BigField>
        <BigField label="Cédula / RUC">
          <Input
            inputMode="numeric"
            value={customer.cedula}
            onChange={(e) => setCustomer({ ...customer, cedula: e.target.value })}
            placeholder="1700000000"
            className="h-12 text-base"
          />
        </BigField>
        <BigField label="Email">
          <Input
            type="email"
            inputMode="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            placeholder="cliente@email.com"
            className="h-12 text-base"
          />
        </BigField>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Paso 3: Envío
// ════════════════════════════════════════════════════════
function StepShipping({
  address,
  setAddress,
  zones,
  carriers,
  carrierId,
  setCarrierId,
  autoShipping,
  shippingOverride,
  setShippingOverride,
  notes,
  setNotes,
  source,
  setSource,
}: {
  address: {
    province: string;
    city: string;
    address: string;
    reference: string;
    zoneId: string;
  };
  setAddress: (a: typeof address) => void;
  zones: Zone[];
  carriers: Carrier[];
  carrierId: string;
  setCarrierId: (v: string) => void;
  autoShipping: number;
  shippingOverride: string;
  setShippingOverride: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  source: string;
  setSource: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">¿A dónde se envía?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Datos de la dirección de entrega y la transportadora.
        </p>
      </div>

      <BigField label="Dirección completa" required>
        <Textarea
          value={address.address}
          onChange={(e) => setAddress({ ...address, address: e.target.value })}
          placeholder="Calle, número, sector, ciudadela…"
          rows={2}
          className="text-base"
        />
      </BigField>

      <div className="grid grid-cols-2 gap-3">
        <BigField label="Ciudad" required>
          <Input
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            className="h-12 text-base"
          />
        </BigField>
        <BigField label="Provincia" required>
          <Input
            value={address.province}
            onChange={(e) => setAddress({ ...address, province: e.target.value })}
            className="h-12 text-base"
          />
        </BigField>
      </div>

      <BigField label="Referencia (opcional)">
        <Input
          value={address.reference}
          onChange={(e) => setAddress({ ...address, reference: e.target.value })}
          placeholder="Casa esquinera, frente a…"
          className="h-12 text-base"
        />
      </BigField>

      <BigField label="Zona" required>
        <Select
          value={address.zoneId}
          onValueChange={(v) => setAddress({ ...address, zoneId: v })}
        >
          <SelectTrigger className="h-12 text-base">
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
      </BigField>

      <BigField label="Transportadora" required>
        <Select value={carrierId} onValueChange={setCarrierId}>
          <SelectTrigger className="h-12 text-base">
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
      </BigField>

      <BigField
        label="Costo de envío"
        hint={`Tarifa automática: ${formatCurrency(autoShipping)}. Solo cámbialo si quieres aplicar uno diferente.`}
      >
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder={autoShipping.toFixed(2)}
          value={shippingOverride}
          onChange={(e) => setShippingOverride(e.target.value)}
          className="h-12 text-base tabular-nums"
        />
      </BigField>

      <details className="rounded-lg border p-3">
        <summary className="text-sm font-medium cursor-pointer">
          Más opciones (origen, notas)
        </summary>
        <div className="mt-3 space-y-3">
          <BigField label="Origen del pedido">
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="WhatsApp, Instagram, Manual…"
              className="h-12 text-base"
            />
          </BigField>
          <BigField label="Notas">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Cualquier indicación adicional para el envío…"
              className="text-base"
            />
          </BigField>
        </div>
      </details>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Paso 4: Resumen
// ════════════════════════════════════════════════════════
function StepReview({
  cart,
  customer,
  address,
  zoneName,
  carrierName,
  subtotal,
  shipping,
  total,
  notes,
  source,
  onJump,
}: {
  cart: CartLine[];
  customer: { name: string; cedula: string; phone: string; email: string };
  address: { province: string; city: string; address: string; reference: string };
  zoneName: string;
  carrierName: string;
  subtotal: number;
  shipping: number;
  total: number;
  notes: string;
  source: string;
  onJump: (s: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Revisar y confirmar</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verifica que todo esté correcto antes de crear el pedido.
        </p>
      </div>

      <SummaryCard title="Productos" onEdit={() => onJump(1)}>
        <ul className="space-y-1.5 text-sm">
          {cart.map((c, i) => (
            <li key={i} className="flex justify-between">
              <span>
                <span className="font-semibold tabular-nums">{c.quantity}×</span>{" "}
                {c.name}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatCurrency(c.price * c.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </SummaryCard>

      <SummaryCard title="Cliente" onEdit={() => onJump(2)}>
        <p className="font-semibold">{customer.name}</p>
        <div className="text-sm text-muted-foreground space-y-0.5">
          {customer.phone && <p>📱 {customer.phone}</p>}
          {customer.cedula && <p>CI/RUC: {customer.cedula}</p>}
          {customer.email && <p>✉ {customer.email}</p>}
        </div>
      </SummaryCard>

      <SummaryCard title="Envío" onEdit={() => onJump(3)}>
        <p className="text-sm">{address.address}</p>
        <p className="text-sm text-muted-foreground">
          {address.city}, {address.province}
        </p>
        {address.reference && (
          <p className="text-xs text-muted-foreground italic mt-1">
            Ref: {address.reference}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline">{zoneName}</Badge>
          <Badge variant="outline">{carrierName}</Badge>
        </div>
      </SummaryCard>

      {(source || notes) && (
        <SummaryCard title="Otros" onEdit={() => onJump(3)}>
          {source && (
            <p className="text-sm">
              <span className="text-muted-foreground">Origen:</span> {source}
            </p>
          )}
          {notes && (
            <p className="text-sm">
              <span className="text-muted-foreground">Notas:</span> {notes}
            </p>
          )}
        </SummaryCard>
      )}

      {/* Totales destacados */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="pt-6 space-y-2">
          <Row label="Subtotal" value={formatCurrency(subtotal)} />
          <Row label="Envío" value={formatCurrency(shipping)} />
          <div className="border-t pt-2 mt-2 flex justify-between text-xl font-bold">
            <span>Total a cobrar</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-primary hover:underline font-medium"
          >
            Editar
          </button>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Barra inferior fija
// ════════════════════════════════════════════════════════
function BottomNav({
  step,
  total,
  itemCount,
  isPending,
  onPrev,
  onNext,
  onSubmit,
}: {
  step: number;
  total: number;
  itemCount: number;
  isPending: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const isLast = step === 4;
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-60 bg-background border-t z-30 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onPrev}
            disabled={isPending}
            className="h-12"
          >
            <ArrowLeft className="size-4" />
          </Button>
        ) : (
          <div className="w-12" />
        )}

        <div className="flex-1 text-center min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {step}/4 · {itemCount} {itemCount === 1 ? "ítem" : "ítems"}
          </p>
          <p className="text-lg font-bold tabular-nums">{formatCurrency(total)}</p>
        </div>

        {isLast ? (
          <Button
            type="button"
            size="lg"
            onClick={onSubmit}
            disabled={isPending}
            className="h-12 flex-1 max-w-[180px]"
          >
            {isPending ? (
              "Creando…"
            ) : (
              <>
                <Check className="size-4" />
                Crear pedido
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={onNext}
            disabled={isPending}
            className="h-12 flex-1 max-w-[180px]"
          >
            Siguiente
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Field con label grande para móvil
// ════════════════════════════════════════════════════════
function BigField({
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
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
