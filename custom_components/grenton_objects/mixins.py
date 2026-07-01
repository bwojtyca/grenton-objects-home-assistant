"""Shared mixins for Grenton Objects entity classes."""

import logging
from datetime import timedelta
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.event import async_track_time_interval

from .const import COMMAND_DEBOUNCE_SECONDS, GATE_FAILURE_THRESHOLD, DOMAIN

_LOGGER = logging.getLogger(__name__)


def build_device_info(grenton_id: str, api_endpoint: str) -> DeviceInfo:
    """Build device registry info for a Grenton entity.

    Entities are grouped by their CLU (the part before "->" in the Grenton
    id), so all objects on the same controller appear under one device.
    Objects without a CLU prefix (gate-level user features / scripts) fall
    back to a single device representing the HTTP gate.
    """
    if grenton_id and "->" in grenton_id:
        clu = grenton_id.split("->")[0]
        return DeviceInfo(
            identifiers={(DOMAIN, clu)},
            name=f"Grenton {clu}",
            manufacturer="Grenton",
        )
    return DeviceInfo(
        identifiers={(DOMAIN, api_endpoint)},
        name="Grenton Gate",
        manufacturer="Grenton",
    )


def is_within_debounce(last_command_time, hass) -> bool:
    """Return True if a command was sent recently and poll results should be ignored."""
    if last_command_time is None:
        return False
    if hass is None or not hasattr(hass, 'loop') or hass.loop is None:
        return False
    if not callable(getattr(hass.loop, 'time', None)):
        return False
    return hass.loop.time() - last_command_time < COMMAND_DEBOUNCE_SECONDS
    

class GrentonPollingMixin:
    """Mixin providing auto-update polling lifecycle for Grenton entities.

    Expects the entity to define:
        _auto_update: bool
        _update_interval: int (seconds)
        _initialized: bool (initially False)
        _unsub_interval: callable | None (initially None)
        async_update(): coroutine
    """

    async def async_added_to_hass(self):
        self._initialized = True
        self._consecutive_failures = 0
        if self._auto_update:
            self._unsub_interval = async_track_time_interval(
                self.hass, self._update_callback, timedelta(seconds=self._update_interval)
            )
            await self.async_update()

    async def async_will_remove_from_hass(self):
        if self._unsub_interval:
            self._unsub_interval()

    async def _update_callback(self, now):
        await self.async_update()

    def _handle_update_success(self) -> None:
        """Record a successful poll: reset the failure count and restore availability."""
        self._consecutive_failures = 0
        if not getattr(self, "_attr_available", True):
            self._attr_available = True

    def _handle_update_failure(self, ex: Exception) -> None:
        """Record a failed poll.

        The last known state is intentionally kept (not blanked) so a single
        failed read doesn't flicker the entity to Unknown. After
        GATE_FAILURE_THRESHOLD consecutive failures the entity is marked
        unavailable, which recovers automatically on the next successful poll.
        """
        self._consecutive_failures = getattr(self, "_consecutive_failures", 0) + 1
        _LOGGER.warning(
            "Failed to update %s (attempt %d, keeping last value): %s",
            getattr(self, "_object_name", None) or getattr(self, "_name", "entity"),
            self._consecutive_failures,
            ex,
        )
        if self._consecutive_failures >= GATE_FAILURE_THRESHOLD and getattr(self, "_attr_available", True):
            self._attr_available = False
            self.async_write_ha_state()
