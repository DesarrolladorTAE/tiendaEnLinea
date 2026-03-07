import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Divider,
  Alert,
  Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAdminUi } from "../../context/AdminUiContext";
import { useTienda } from "../../context/TiendaContext";

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

import { showConfirm } from "../../utils/alerts";

const PLAN_NAMES = {
  1: "Plan Demo",
  2: "Plan Negocio",
  3: "Plan Profesional",
  4: "Plan Avanzado",
};

const PLAN_DEMO_ID = 1;
const PLAN_AVANZADO_ID = 4;

const COLORS = {
  accent: "#f9b233",
  black: "#000000",
};

export default function PromosCoupons() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const { selectedBranch, setSelectedBranch, setHideLayout } = useAdminUi();
  const { tienda, tiendaLoading } = useTienda();

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

  const planId = useMemo(() => {
    return Number(
      tienda?.plan_id ||
        tienda?.subscription?.plan_id ||
        tienda?.store_plan?.plan_id ||
        0
    );
  }, [tienda]);

  const nombrePlanActual = useMemo(() => {
    return PLAN_NAMES[planId] || "Sin plan asignado";
  }, [planId]);

  const canUseDiscounts = useMemo(() => {
    return planId === PLAN_DEMO_ID || planId === PLAN_AVANZADO_ID;
  }, [planId]);

  const handleRestricted = useCallback(async () => {
    const ok = await showConfirm(
      `Tu plan actual es ${nombrePlanActual}.\n\nPara usar Promociones y Cupones necesitas:\n- Plan Demo\n- o Plan Avanzado.`,
      "Ver planes"
    );

    if (ok) {
      navigate("/admin/planes");
    }
  }, [navigate, nombrePlanActual]);

  const [tab, setTab] = useState(0);

  const promos = usePromotionsAdmin({ apiBase });
  const coupons = useCouponsAdmin({ apiBase });

  const current = tab === 0 ? promos : coupons;

  const guardedCreate = useCallback(() => {
    if (!canUseDiscounts) {
      handleRestricted();
      return;
    }
    current.openCreate();
  }, [canUseDiscounts, handleRestricted, current]);

  const guardedPromoEdit = useCallback(
    (row) => {
      if (!canUseDiscounts) {
        handleRestricted();
        return;
      }
      promos.openEdit(row);
    },
    [canUseDiscounts, handleRestricted, promos]
  );

  const guardedPromoRules = useCallback(
    (row) => {
      if (!canUseDiscounts) {
        handleRestricted();
        return;
      }
      promos.openRules(row);
    },
    [canUseDiscounts, handleRestricted, promos]
  );

  const guardedCouponEdit = useCallback(
    (row) => {
      if (!canUseDiscounts) {
        handleRestricted();
        return;
      }
      coupons.openEdit(row);
    },
    [canUseDiscounts, handleRestricted, coupons]
  );

  const guardedCouponRules = useCallback(
    (row) => {
      if (!canUseDiscounts) {
        handleRestricted();
        return;
      }
      coupons.openRules(row);
    },
    [canUseDiscounts, handleRestricted, coupons]
  );

  return (
    <PageShell>
      <PageHeader
        title={tab === 0 ? "🚨 Promociones" : "🎫 Cupones"}
        subtitle={
          tab === 0
            ? "Crea promociones, asígnales reglas y controla su aplicación por sucursal."
            : "Crea cupones, define vigencia y reglas de aplicación o exclusión."
        }
        branch={activeBranch}
        planName={nombrePlanActual}
        canUse={canUseDiscounts}
        tiendaLoading={tiendaLoading}
        loading={current.loading}
        onBack={() => navigate("/admin/sucursales")}
        onRefresh={current.fetchList}
        onCreate={guardedCreate}
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
          <Tab label="🎫 Cupones" />
        </Tabs>

        <Divider />

        {!canUseDiscounts ? (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="warning"
              sx={{
                borderRadius: 2,
                bgcolor: alpha(COLORS.accent, 0.1),
                border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
              }}
              action={
                <Button
                  size="small"
                  onClick={handleRestricted}
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    color: COLORS.black,
                  }}
                >
                  Ver planes
                </Button>
              }
            >
              Esta función no está disponible con tu plan actual.
              <br />
              <b>Tu plan actual:</b> {nombrePlanActual}
              <br />
              <b>Para usar Promociones y Cupones necesitas:</b>
              <br />• <b>Plan Demo</b>
              <br />• o <b>Plan Avanzado</b>
            </Alert>
          </Box>
        ) : null}

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
              onEdit={guardedPromoEdit}
              onDelete={promos.deleteRow}
              onRules={guardedPromoRules}
            />
          ) : (
            <CouponList
              rows={coupons.rows}
              loading={coupons.loading}
              onEdit={guardedCouponEdit}
              onDelete={coupons.deleteRow}
              onRules={guardedCouponRules}
            />
          )}
        </Box>
      </Paper>

      <PromoFormDialog
        open={Boolean(promos.openForm)}
        onClose={promos.closeForm}
        editing={!!promos.editing}
        form={promos.form}
        setForm={promos.setForm}
        onSave={promos.save}
        saving={promos.saving}
        imgPreview={promos.imgPreview}
        imgUploading={promos.imgUploading}
        onPickImage={promos.onPickImage}
      />

      <PromoRulesDialog
        open={Boolean(promos.openRulesModal)}
        onClose={promos.closeRules}
        promo={promos.rulesOwner}
        rules={promos.rules}
        loading={promos.rulesLoading}
        onAdd={promos.addRule}
        onDelete={promos.deleteRule}
        apiBase={apiBase}
      />

      <CouponFormDialog
        open={Boolean(coupons.openForm)}
        onClose={coupons.closeForm}
        editing={!!coupons.editing}
        form={coupons.form}
        setForm={coupons.setForm}
        onSave={coupons.save}
        saving={coupons.saving}
      />

      <CouponRulesDialog
        open={Boolean(coupons.openRulesModal)}
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