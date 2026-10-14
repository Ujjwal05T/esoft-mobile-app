import type {
  CatalogCompatibleVehicle,
  CatalogItemSummary,
} from '../../services/api';
import type { PartProduct } from '../dashboard/PartProductCard';

/** Catalog API item → the product shape the cart, cards and detail screen already use. */
export function toPartProduct(item: CatalogItemSummary): PartProduct {
  return {
    // Cart lines are keyed by the sellable item (variant) id
    id: String(item.variantId),
    sku: item.sku,
    name: item.name,
    brand: item.brandName,
    price: item.price,
    // The cards only show an MRP above the selling price
    mrp: item.mrp && item.mrp > item.price ? item.mrp : item.price,
    imageUrl: item.imageUrl ?? undefined,
    // Stock 0 is "On Order": it goes through an inquiry instead of the cart
    badge: item.isOnOrder ? 'On Order' : undefined,
    outOfStock: item.isOnOrder,
    volume: item.attrValue ?? undefined,
    category: item.categoryName,
    verifyFit: item.verifyFit,
  };
}

export function describeCompatibleVehicle(v: CatalogCompatibleVehicle): string {
  const base = `${v.manufacturer} ${v.baseModel}`;
  return v.variant ? `${base} – ${v.variant}` : `${base} (all variants)`;
}
