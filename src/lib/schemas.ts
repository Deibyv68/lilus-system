import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(1, "SKU requerido").max(40),
  name: z.string().min(1, "Nombre requerido").max(120),
  shortName: z.string().max(40).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Precio inválido"),
  productionCost: z.coerce.number().min(0).default(0),
  weightGrams: z.coerce.number().min(0).optional(),
  ingredients: z.string().max(2000).optional().or(z.literal("")),
  shelfLifeMonths: z.coerce.number().int().min(1).max(120).default(12),
  stock: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

export const packSchema = z.object({
  sku: z.string().min(1, "SKU requerido").max(40),
  name: z.string().min(1, "Nombre requerido").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
  price: z.coerce.number().min(0),
  productionCost: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(100),
      })
    )
    .min(1, "Un pack debe contener al menos un producto"),
});

export type PackInput = z.infer<typeof packSchema>;

export const customerSchema = z.object({
  name: z.string().min(1).max(120),
  cedula: z.string().max(20).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
});

export const shippingAddressSchema = z.object({
  province: z.string().min(1, "Provincia requerida").max(60),
  city: z.string().min(1, "Ciudad requerida").max(60),
  address: z.string().min(1, "Dirección requerida").max(300),
  reference: z.string().max(300).optional().or(z.literal("")),
  zoneId: z.string().min(1, "Zona de envío requerida"),
});

export const orderItemSchema = z.object({
  kind: z.enum(["product", "pack"]),
  refId: z.string().min(1), // productId o packId
  variantId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(999),
});

export const orderSchema = z.object({
  customer: customerSchema,
  address: shippingAddressSchema,
  carrierId: z.string().min(1, "Selecciona transportadora"),
  shippingCost: z.coerce.number().min(0),
  notes: z.string().max(2000).optional().or(z.literal("")),
  source: z.string().max(40).optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1, "Agrega al menos un producto"),
});

export type OrderInput = z.infer<typeof orderSchema>;
