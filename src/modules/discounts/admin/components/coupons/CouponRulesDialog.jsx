import React from "react";
import { PromoRulesDialog } from "../promos/PromoRulesDialog";

export function CouponRulesDialog({ open, onClose, coupon, rules, loading, onAdd, onDelete }) {
  return (
    <PromoRulesDialog
      open={open}
      onClose={onClose}
      promo={coupon ? { name: coupon.code } : null}  // solo para título
      rules={rules}
      loading={loading}
      onAdd={onAdd}
      onDelete={onDelete}
    />
  );
}