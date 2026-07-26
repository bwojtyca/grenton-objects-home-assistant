"""
==================================================
Sidebar panel + websocket API for OM project analysis.

Registers a custom sidebar panel ("Grenton") whose frontend (panel.js) lets the
user upload an Object Manager project file (.omp) and renders a read-only
reconciliation report against the live Home Assistant configuration. The heavy
lifting is done server-side by report.py and returned over a websocket command.

Repository: https://github.com/bwojtyca/grenton-objects-home-assistant
==================================================
"""

from __future__ import annotations

import base64
import logging
import os

import voluptuous as vol
from homeassistant.components import frontend, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from . import report
from . import rewrite
from .const import (
    DOMAIN,
    CONF_API_ENDPOINT,
    CONF_GRENTON_ID,
    CONF_GRENTON_TYPE,
    CONF_OBJECT_NAME,
    CONF_DEVICE_CLASS,
    CONF_REVERSED,
    CONF_AUTO_UPDATE,
    CONF_UPDATE_INTERVAL,
    DEFAULT_UPDATE_INTERVAL,
)

_LOGGER = logging.getLogger(__name__)

PANEL_URL_PATH = DOMAIN  # panel reached directly at /{DOMAIN} (no sidebar entry)
PANEL_JS_URL = "/grenton_objects_frontend/panel.js"
PANEL_ELEMENT = "grenton-objects-panel"
_REGISTERED_FLAG = f"{DOMAIN}_panel_registered"


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Register the static frontend, the websocket command and the panel.

    The panel is registered with ``show_in_sidebar=False`` (no sidebar icon) and
    WITHOUT ``config_panel_domain`` — it is reached directly via its URL
    ``/{DOMAIN}``. ``config_panel_domain`` is deliberately avoided: for a
    multi-entry integration it hijacks each entry's gear/"Configure" and
    suppresses the per-entry options flow.
    """
    if hass.data.get(_REGISTERED_FLAG):
        return
    hass.data[_REGISTERED_FLAG] = True

    panel_js_path = os.path.join(os.path.dirname(__file__), "panel.js")
    await hass.http.async_register_static_paths(
        [StaticPathConfig(PANEL_JS_URL, panel_js_path, cache_headers=False)]
    )

    websocket_api.async_register_command(hass, ws_analyze_project)
    websocket_api.async_register_command(hass, ws_set_auto_update)
    websocket_api.async_register_command(hass, ws_add_object)
    websocket_api.async_register_command(hass, ws_rewrite_project)

    # Cache-bust the module URL with the integration version, otherwise the
    # browser/frontend keeps serving an old panel.js from the fixed URL.
    try:
        integration = await async_get_integration(hass, DOMAIN)
        version = str(integration.version or "")
    except Exception:  # noqa: BLE001 - versioning is best-effort
        version = ""
    module_url = f"{PANEL_JS_URL}?v={version}" if version else PANEL_JS_URL

    if not frontend.async_panel_exists(hass, PANEL_URL_PATH):
        frontend.async_register_built_in_panel(
            hass,
            "custom",
            frontend_url_path=PANEL_URL_PATH,
            require_admin=True,
            show_in_sidebar=False,
            config={
                "_panel_custom": {
                    "name": PANEL_ELEMENT,
                    "module_url": module_url,
                    "embed_iframe": False,
                    "trust_external": False,
                }
            },
        )


@websocket_api.websocket_command(
    {
        vol.Required("type"): "grenton_objects/analyze",
        vol.Required("omp_base64"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_analyze_project(hass, connection, msg) -> None:
    """Parse an uploaded .omp (base64) and return the reconciliation report."""
    try:
        data = base64.b64decode(msg["omp_base64"])
        parsed = await hass.async_add_executor_job(report.parse_omp_bytes, data)
    except Exception as err:  # noqa: BLE001 - surface any parse failure to the panel
        _LOGGER.warning("Grenton project analysis failed: %s", err)
        connection.send_error(msg["id"], "invalid_omp", str(err))
        return

    ha_objects = report.collect_ha_objects(hass)
    result = report.build_report(
        parsed["objects"], parsed["push_events"], ha_objects, parsed.get("all_names")
    )
    result["clus"] = parsed["clus"]
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): "grenton_objects/set_auto_update",
        vol.Required("entry_id"): str,
        vol.Required("auto_update"): bool,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_set_auto_update(hass, connection, msg) -> None:
    """Repair action: toggle a Grenton object's automatic polling (auto_update).

    Used from the panel to remove redundant polling on push entities. Writes the
    config entry's options; the integration's update listener reloads the entry.
    """
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        connection.send_error(msg["id"], "not_found", "Nie znaleziono wpisu konfiguracji.")
        return
    options = {**entry.options, "auto_update": msg["auto_update"]}
    hass.config_entries.async_update_entry(entry, options=options)
    connection.send_result(msg["id"], {"ok": True})


_ADD_DEVICE_TYPES = {"light", "switch", "cover", "climate", "sensor", "binary_sensor"}


def _infer_grenton_type(device_type: str, om_type: str | None) -> str | None:
    """Best-effort Grenton object type for a new entry, from OM type."""
    t = om_type or ""
    if device_type == "binary_sensor":
        return "SATEL_INPUT" if t == "SatelInput" else "DIN"
    if device_type == "switch":
        if t == "SatelZone":
            return "SATEL_ZONE"
        if t == "SatelOutput":
            return "SATEL_OUTPUT"
        return "DOUT"
    if device_type == "light":
        if t.startswith("DALI"):
            return "DALI"
        if t == "LEDRGB":
            return "RGB"
        if t == "LED_CHANNEL":
            return "LED_CHANNEL"
        if t.startswith("LED"):
            return "LED"
        if "DIM" in t.upper():
            return "DIMMER"
        return "DOUT"
    if device_type == "sensor":
        return "DEFAULT_SENSOR"
    return None  # cover / climate: no grenton_type in the config entry


@websocket_api.websocket_command(
    {
        vol.Required("type"): "grenton_objects/add_object",
        vol.Required("grenton_id"): str,
        vol.Required("device_type"): str,
        vol.Optional("om_type"): str,
        vol.Optional("name"): str,
        # Optional overrides edited by the user in the confirm form; anything
        # omitted falls back to inference/defaults below.
        vol.Optional("api_endpoint"): str,
        vol.Optional("grenton_type"): str,
        vol.Optional("device_class"): str,
        vol.Optional("reversed"): bool,
        vol.Optional("auto_update"): bool,
        vol.Optional("update_interval"): int,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_add_object(hass, connection, msg) -> None:
    """Repair action: add an HA entity for a Grenton object present in the .omp
    but not yet in HA. Creates a config entry via the flow's import step, using
    the values edited in the confirm form (with sensible fallbacks): the gateway
    endpoint defaults to an existing entry's, the Grenton type is inferred from
    the OM type, polling is on by default."""
    device_type = msg["device_type"]
    if device_type not in _ADD_DEVICE_TYPES:
        connection.send_error(msg["id"], "bad_type", "Nieobsługiwany typ encji.")
        return

    endpoint = msg.get("api_endpoint")
    if not endpoint:
        for entry in hass.config_entries.async_entries(DOMAIN):
            endpoint = entry.options.get(CONF_API_ENDPOINT) or entry.data.get(CONF_API_ENDPOINT)
            if endpoint:
                break
    if not endpoint:
        connection.send_error(msg["id"], "no_endpoint", "Brak istniejącego endpointu — dodaj pierwszy obiekt ręcznie.")
        return

    data = {
        "device_type": device_type,
        CONF_API_ENDPOINT: endpoint,
        CONF_GRENTON_ID: msg["grenton_id"],
        CONF_OBJECT_NAME: msg.get("name") or msg["grenton_id"],
        CONF_AUTO_UPDATE: msg.get("auto_update", True),
        CONF_UPDATE_INTERVAL: msg.get("update_interval", DEFAULT_UPDATE_INTERVAL),
    }
    grenton_type = msg.get("grenton_type") or _infer_grenton_type(device_type, msg.get("om_type"))
    if grenton_type:
        data[CONF_GRENTON_TYPE] = grenton_type
    if device_type in ("switch", "cover"):
        data[CONF_REVERSED] = msg.get("reversed", False)
    if device_type == "cover":
        data[CONF_DEVICE_CLASS] = msg.get("device_class") or "shutter"
    elif device_type in ("sensor", "binary_sensor") and msg.get("device_class"):
        data[CONF_DEVICE_CLASS] = msg["device_class"]

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": "import"}, data=data
    )
    if result.get("type") == "abort":
        connection.send_error(msg["id"], result.get("reason") or "abort", "Nie dodano (możliwy duplikat).")
        return
    connection.send_result(msg["id"], {"ok": True})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "grenton_objects/rewrite_omp",
        vol.Required("omp_base64"): str,
        vol.Required("fixes"): [
            {
                vol.Required("target_entity"): str,
                vol.Optional("new_service"): str,
                vol.Optional("new_entity"): str,
            }
        ],
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_rewrite_project(hass, connection, msg) -> None:
    """Repair action (Grenton-side): apply the selected push-binding fixes to an
    uploaded .omp and return a corrected copy (base64) to download. The user's
    original file is never modified; edits are minimal, single-argument swaps
    (see rewrite.py) and must be verified in Object Manager before use."""
    try:
        data = base64.b64decode(msg["omp_base64"])
        result = await hass.async_add_executor_job(rewrite.apply_push_fixes, data, msg["fixes"])
    except Exception as err:  # noqa: BLE001 - surface any rewrite failure to the panel
        _LOGGER.warning("Grenton project rewrite failed: %s", err)
        connection.send_error(msg["id"], "rewrite_failed", str(err))
        return
    connection.send_result(msg["id"], {
        "omp_base64": base64.b64encode(result["omp"]).decode("ascii"),
        "applied": result["applied"],
        "skipped": result["skipped"],
    })
