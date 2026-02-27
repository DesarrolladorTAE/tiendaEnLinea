import React, { useMemo, useState } from "react";
import { Box, Paper, Tabs, Tab, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAdminUi } from "../../context/AdminUiContext";

import { useAdminBranch } from "../../modules/discounts/admin/components/useAdminBranch";
import { PageShell } from "../../modules/discounts/admin/components/PageShell";
import { PageHeader } from "../../modules/discounts/admin/components/PageHeader";
import { FiltersBar } from "../../modules/discounts/admin/components/FiltersBar";

import { PromoList } from "../../modules/discounts/admin/components/promos/PromoList";
import { PromoFormDialog } from "../../modules/discounts/admin/components/promos/PromoFormDialog";
import { PromoRulesDialog } from "../../modules/discounts/admin/components/promos/PromoRulesDialog";
import { usePromotionsAdmin } from "../../modules/discounts/admin/usePromotionsAdmin";

import { CouponList } from "../../modules/discounts/admin/components/coupons/CouponList";
import { CouponFormDialog } from "../../modules/discounts/admin/components/coupons/CouponFormDialog";
import { CouponRulesDialog } from "../../modules/discounts/admin/components/coupons/CouponRulesDialog";
import { useCouponsAdmin } from "../../modules/discounts/admin/useCouponsAdmin";

export default function PromosCoupons() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { selectedBranch, setSelectedBranch, setHideLayout } = useAdminUi();

  // ✅ branch resolver (nav state > context > querystring)
  const branchFromNav = location.state?.branch ?? null;
  const branchIdFromUrl = params.get("branch_id");

  const activeBranch = useAdminBranch({
    branchFromNav,
    branchIdFromUrl,
    selectedBranch,
    setSelectedBranch,
    setHideLayout,
    navigate,
  });

  const apiBase = useMemo(() => {
    return activeBranch?.id ? `/admin/branches/${activeBranch.id}` : "";
  }, [activeBranch?.id]);

  const [tab, setTab] = useState(0);

  // =================== PROMOS ===================
  const promos = usePromotionsAdmin({ apiBase });

  // =================== COUPONS ==================
  const coupons = useCouponsAdmin({ apiBase });

  // UI selecciona “dataset” según tab
  const current = tab === 0 ? promos : coupons;

  return (
    <PageShell>
      <PageHeader
        title={tab === 0 ? "🚨 Promociones" : "🎫 Cupones"}
        subtitle={
          tab === 0
            ? "Crea promociones, súbeles imagen y define reglas por producto/variante/categoría/atributos."
            : "Crea cupones, define vigencia y reglas de aplicación/exclusión."
        }
        branch={activeBranch}
        loading={current.loading}
        onBack={() => navigate("/admin/sucursales")}
        onRefresh={current.fetchList}
        onCreate={current.openCreate}
      />

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid rgba(0,0,0,0.08)`,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ px: 1 }}
        >
          <Tab label="🚨 Promociones" />
          <Tab label="🎫Cupones" />
        </Tabs>
        <Divider />

        <Box sx={{ p: 2 }}>
          <FiltersBar
            q={current.q}
            status={current.status}
            loading={current.loading}
            onQ={current.setQ}
            onStatus={current.setStatus}
            onSearch={current.fetchList}
          />
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          {tab === 0 ? (
            <PromoList
              rows={promos.rows}
              loading={promos.loading}
              onEdit={promos.openEdit}
              onDelete={promos.deleteRow}
              onRules={promos.openRules}
            />
          ) : (
            <CouponList
              rows={coupons.rows}
              loading={coupons.loading}
              onEdit={coupons.openEdit}
              onDelete={coupons.deleteRow}
              onRules={coupons.openRules}
            />
          )}
        </Box>
      </Paper>

      {/* ================= PROMOS MODALS ================= */}
      <PromoFormDialog
        open={promos.openForm}
        onClose={promos.closeForm}
        editing={promos.editing}
        form={promos.form}
        setForm={promos.setForm}
        onSave={promos.save}
        saving={promos.saving}
        imgPreview={promos.imgPreview}
        imgUploading={promos.imgUploading}
        onPickImage={promos.onPickImage}
      />

<PromoRulesDialog
  open={promos.openRulesModal}
  onClose={promos.closeRules}
  promo={promos.rulesOwner}
  rules={promos.rules}
  loading={promos.rulesLoading}
  onAdd={promos.addRule}
  onDelete={promos.deleteRule}
  apiBase={apiBase}   // ✅ necesario para el ProductPicker
  activeBranchId={activeBranch?.id}
/>

      {/* ================= COUPONS MODALS ================= */}
      <CouponFormDialog
        open={coupons.openForm}
        onClose={coupons.closeForm}
        editing={coupons.editing}
        form={coupons.form}
        setForm={coupons.setForm}
        onSave={coupons.save}
        saving={coupons.saving}
      />

      <CouponRulesDialog
        open={coupons.openRulesModal}
        onClose={coupons.closeRules}
        coupon={coupons.rulesOwner}
        rules={coupons.rules}
        loading={coupons.rulesLoading}
        onAdd={coupons.addRule}
        onDelete={coupons.deleteRule}
      />
    </PageShell>
  );
}
