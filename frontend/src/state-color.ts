/*
 * Faithful port of Home Assistant's entity state-colour logic, so our icons are
 * coloured exactly like HA. Ported from home-assistant/frontend:
 *   - src/common/entity/state_color.ts   (stateColorCss, domainColorProperties)
 *   - src/common/entity/state_active.ts  (stateActive)
 *   - src/resources/css-variables.ts     (computeCssVariable)
 * HA doesn't publish these as a library, so we vendor the algorithm verbatim.
 */

export interface SimpleStateObj {
  entity_id: string;
  state: string;
  attributes: { device_class?: string; [key: string]: unknown };
}

const UNAVAILABLE = "unavailable";
const UNKNOWN = "unknown";
const OFF = "off";

const STATE_COLORED_DOMAIN = new Set([
  "alarm_control_panel", "alert", "automation", "binary_sensor", "calendar", "camera",
  "climate", "cover", "device_tracker", "fan", "group", "humidifier", "input_boolean",
  "lawn_mower", "light", "lock", "media_player", "person", "plant", "remote", "schedule",
  "script", "siren", "sun", "switch", "timer", "update", "vacuum", "valve", "water_heater",
  "weather",
]);

const TIMESTAMP_STATE_DOMAINS = new Set([
  "ai_task", "button", "conversation", "event", "image", "infrared", "input_button",
  "notify", "radio_frequency", "scene", "stt", "tag", "tts", "wake_word", "datetime",
]);

const computeDomain = (entityId: string): string => entityId.substring(0, entityId.indexOf("."));

// slugify(state, "_") — HA's slugify with "_" separator, good enough for states.
const slugify = (value: string): string =>
  String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "") || "_";

// css-variables.ts computeCssVariable: nested var() fallback chain.
const computeCssVariable = (props: string[]): string | undefined =>
  props.reduceRight<string | undefined>(
    (str, variable) => `var(${variable}${str ? `, ${str}` : ""})`,
    undefined
  );

export function stateActive(stateObj: SimpleStateObj, state?: string): boolean {
  const domain = computeDomain(stateObj.entity_id);
  const compareState = state !== undefined ? state : stateObj.state;

  if (TIMESTAMP_STATE_DOMAINS.has(domain)) {
    return compareState !== UNAVAILABLE;
  }
  if (compareState === UNAVAILABLE || compareState === UNKNOWN) {
    return false;
  }
  if (compareState === OFF && domain !== "alert") {
    return false;
  }

  switch (domain) {
    case "alarm_control_panel":
      return compareState !== "disarmed";
    case "alert":
      return compareState !== "idle";
    case "cover":
      return compareState !== "closed";
    case "device_tracker":
    case "person":
      return compareState !== "not_home";
    case "lawn_mower":
      return !["docked", "paused"].includes(compareState);
    case "lock":
      return compareState !== "locked";
    case "media_player":
      return compareState !== "standby";
    case "vacuum":
      return !["idle", "docked", "paused"].includes(compareState);
    case "valve":
      return compareState !== "closed";
    case "plant":
      return compareState === "problem";
    case "group":
      return ["on", "home", "open", "locked", "problem"].includes(compareState);
    case "timer":
      return compareState === "active";
    case "camera":
      return compareState === "streaming";
    default:
      return true;
  }
}

function domainColorProperties(
  domain: string,
  deviceClass: string | undefined,
  state: string,
  active: boolean
): string[] {
  const properties: string[] = [];
  const stateKey = slugify(state);
  const activeKey = active ? "active" : "inactive";
  if (deviceClass) {
    properties.push(`--state-${domain}-${deviceClass}-${stateKey}-color`);
  }
  properties.push(
    `--state-${domain}-${stateKey}-color`,
    `--state-${domain}-${activeKey}-color`,
    `--state-${activeKey}-color`
  );
  return properties;
}

/** Return a CSS color (var chain) for an entity's state, or undefined if the
 *  domain is not state-coloured (caller should fall back to a neutral colour). */
export function stateColorCss(stateObj: SimpleStateObj, state?: string): string | undefined {
  const compareState = state !== undefined ? state : stateObj.state;
  if (compareState === UNAVAILABLE) {
    return "var(--state-unavailable-color)";
  }
  const domain = computeDomain(stateObj.entity_id);
  if (!STATE_COLORED_DOMAIN.has(domain)) {
    return undefined;
  }
  const active = stateActive(stateObj, state);
  return computeCssVariable(
    domainColorProperties(domain, stateObj.attributes.device_class, compareState, active)
  );
}
