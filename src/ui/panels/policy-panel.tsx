import { createSignal, createTrackedEffect, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
} from "@ui-sdk/solid/slider";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { t } from "../localization";
import { formatBillion, formatPercent } from "~/state/format";
import { N2_RATE_MAX, N2_RATE_MIN, recoveryFor } from "~/domain";

export const PolicyPanel = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const [rate, setRate] = createSignal(state().policy.n2Rate);
  createTrackedEffect(() => {
    setRate(state().policy.n2Rate);
  });
  const canN2 = () => state().clock.year >= 2024;
  const preview = () => recoveryFor(state().finance, state().clock.year, rate(), true);

  const reforms = [
    {
      key: "nsmo" as const,
      label: "policy.nsmo",
      desc: "policy.nsmoDesc",
      enabled: () => state().policy.nsmo,
      action: () => actions.enableNsmo(),
      cost: 250,
      icon: "lucide:zap" as const,
    },
    {
      key: "dppa" as const,
      label: "policy.dppa",
      desc: "policy.dppaDesc",
      enabled: () => state().policy.dppa,
      action: () => actions.enableDppa(),
      cost: 400,
      icon: "lucide:leaf" as const,
    },
    {
      key: "vrem" as const,
      label: "policy.vrem",
      desc: "policy.vremDesc",
      enabled: () => state().policy.vrem,
      action: () => actions.enableVrem(),
      cost: 350,
      icon: "lucide:scale" as const,
    },
  ];

  return (
    <div class="stack-lg">
      <Panel title={t("policy.title")} kicker={t("panel.policyDesc")} icon="lucide:landmark">
        <div class="policy-hero">
          <div>
            <p class="eyebrow">{t("policy.debateScore")}</p>
            <strong class="big-number">{Math.round(state().metrics.debateScore)}</strong>
            <Bar value={state().metrics.debateScore} tone="gold" label={t("policy.debateScore")} />
            <p class="muted">{t("policy.debateHelp")}</p>
          </div>
          <div class="policy-role-card">
            <Icon icon="lucide:landmark" size={26} />
            <strong>{t("policy.roles")}</strong>
            <p>{t("policy.rolesText")}</p>
          </div>
        </div>
      </Panel>

      <Panel
        title={t("policy.n2")}
        kicker={canN2() ? t("policy.enact") : t("finance.auditPending")}
        icon="lucide:scale"
      >
        <div class="policy-row">
          <div>
            <h4>{t("policy.n2")}</h4>
            <p class="muted">{t("policy.n2Desc")}</p>
            <Show when={!canN2()}>
              <Badge tone="warn">{t("error.policy.too-early")}</Badge>
            </Show>
          </div>
          <ActionButton
            variant="gold"
            disabled={!canN2() || state().policy.n2Enabled}
            onClick={() => actions.enactRecovery()}
          >
            {state().policy.n2Enabled ? t("policy.enabled") : t("policy.enact")}
          </ActionButton>
        </div>
        <Show when={state().policy.n2Enabled}>
          <div class="slider-row">
            <div class="slider-head">
              <span>{t("policy.n2Rate")}</span>
              <strong>{formatPercent(rate() * 100)}</strong>
            </div>
            <Slider
              value={rate()}
              min={N2_RATE_MIN}
              max={N2_RATE_MAX}
              step={0.01}
              onValueChange={(value) => setRate(Number(value))}
              aria-label={t("policy.n2Rate")}
            >
              <SliderControl>
                <SliderTrack>
                  <SliderIndicator />
                  <SliderThumb aria-label={t("policy.n2Rate")} />
                </SliderTrack>
              </SliderControl>
            </Slider>
            <div class="slider-scale">
              <span>{formatPercent(N2_RATE_MIN * 100)}</span>
              <span>{formatPercent(N2_RATE_MAX * 100)}</span>
            </div>
            <p class="muted">{t("policy.n2RateHelp")}</p>
          </div>
          <div class="stat-grid">
            <Stat
              label={t("finance.eligible")}
              value={formatBillion(preview().eligibleLoss)}
              icon="lucide:scale"
            />
            <Stat
              label={t("finance.monthlyCredit")}
              value={formatBillion(preview().monthlyCredit)}
              tone="good"
              icon="lucide:coins"
            />
            <Stat
              label={t("finance.remaining")}
              value={formatBillion(preview().remaining)}
              icon="lucide:clock"
            />
            <Stat
              label={t("policy.inflation")}
              value={formatPercent(state().metrics.inflation)}
              tone={state().metrics.inflation > 8 ? "bad" : "warn"}
              icon="lucide:trending-up"
            />
          </div>
          <ActionButton variant="secondary" onClick={() => actions.setRecoveryRate(rate())}>
            {t("action.apply")}
          </ActionButton>
        </Show>
      </Panel>

      <Panel title={t("policy.roles")} kicker={t("panel.policy")} icon="lucide:zap">
        <div class="reform-list">
          {reforms.map((reform) => (
            <div class="reform-card" data-enabled={reform.enabled()}>
              <span class="action-icon">
                <Icon icon={reform.icon} size={18} />
              </span>
              <div class="reform-main">
                <div class="reform-head">
                  <strong>{t(reform.label)}</strong>
                  <Badge tone={reform.enabled() ? "good" : "neutral"}>
                    {reform.enabled() ? t("policy.enabled") : t("policy.notEnabled")}
                  </Badge>
                </div>
                <p class="muted">{t(reform.desc)}</p>
              </div>
              <div class="reform-side">
                <span>{formatBillion(reform.cost)}</span>
                <ActionButton
                  size="sm"
                  variant="secondary"
                  disabled={reform.enabled()}
                  onClick={reform.action}
                >
                  {reform.enabled() ? t("policy.enabled") : t("policy.enact")}
                </ActionButton>
              </div>
            </div>
          ))}
          <div class="reform-card" data-enabled={state().policy.twoPartTariff}>
            <span class="action-icon">
              <Icon icon="lucide:gauge" size={18} />
            </span>
            <div class="reform-main">
              <div class="reform-head">
                <strong>{t("policy.twoPart")}</strong>
                <Badge tone={state().policy.twoPartTariff ? "good" : "neutral"}>
                  {state().policy.twoPartTariff ? t("policy.enabled") : t("policy.notEnabled")}
                </Badge>
              </div>
              <p class="muted">{t("policy.twoPartDesc")}</p>
            </div>
            <div class="reform-side">
              <span>{t("action.free")}</span>
              <ActionButton
                size="sm"
                variant="secondary"
                disabled={state().policy.twoPartTariff || !state().policy.vrem}
                onClick={() => actions.enableTwoPart()}
              >
                {state().policy.vrem ? t("policy.enact") : t("policy.requiresVrem")}
              </ActionButton>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={t("panel.policy")} kicker={t("pillar.retail")} icon="lucide:shield">
        <div class="policy-actions">
          <ActionButton
            variant="secondary"
            icon="lucide:sparkles"
            disabled={state().policy.campaignCooldown > 0}
            onClick={() => actions.invest("campaign")}
          >
            {t("action.campaign")}
          </ActionButton>
          <ActionButton
            variant="secondary"
            icon="lucide:shield"
            disabled={state().policy.antiSmuggling}
            onClick={() => actions.invest("crackdown")}
          >
            {t("action.crackdown")}
          </ActionButton>
        </div>
        <p class="muted">{t("action.campaignDesc")}</p>
        <div class="tag-row">
          <Badge tone={state().policy.antiSmuggling ? "good" : "warn"}>
            {t("policy.antiSmuggling")}:{" "}
            {state().policy.antiSmuggling ? t("policy.enabled") : t("policy.notEnabled")}
          </Badge>
          <Badge tone={state().policy.nsmo ? "good" : "neutral"}>NSMO</Badge>
          <Badge tone={state().policy.dppa ? "good" : "neutral"}>DPPA</Badge>
          <Badge tone={state().policy.vrem ? "good" : "neutral"}>VREM</Badge>
        </div>
      </Panel>
    </div>
  );
};
