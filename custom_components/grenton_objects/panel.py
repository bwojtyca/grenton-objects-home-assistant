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

from . import report
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

PANEL_URL_PATH = "grenton-objects"
PANEL_JS_URL = "/grenton_objects_frontend/panel.js"
PANEL_ELEMENT = "grenton-objects-panel"
_REGISTERED_FLAG = f"{DOMAIN}_panel_registered"


async def async_setup_panel(hass: HomeAssistant) -> None:
    """Register the static frontend, the websocket command and the sidebar panel."""
    if hass.data.get(_REGISTERED_FLAG):
        return
    hass.data[_REGISTERED_FLAG] = True

    panel_js_path = os.path.join(os.path.dirname(__file__), "panel.js")
    await hass.http.async_register_static_paths(
        [StaticPathConfig(PANEL_JS_URL, panel_js_path, cache_headers=False)]
    )

    websocket_api.async_register_command(hass, ws_analyze_project)

    try:
        frontend.async_register_built_in_panel(
            hass,
            "custom",
            sidebar_title="Grenton",
            sidebar_icon="mdi:home-automation",
            frontend_url_path=PANEL_URL_PATH,
            require_admin=True,
            config={
                "_panel_custom": {
                    "name": PANEL_ELEMENT,
                    "module_url": PANEL_JS_URL,
                    "embed_iframe": False,
                    "trust_external": False,
                }
            },
        )
    except ValueError:
        # Panel already registered (e.g. integration reload) — nothing to do.
        pass


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
