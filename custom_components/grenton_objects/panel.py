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
from .const import DOMAIN

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
    result = report.build_report(parsed["objects"], parsed["push_events"], ha_objects)
    result["clus"] = parsed["clus"]
    connection.send_result(msg["id"], result)
