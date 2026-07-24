"""
==================================================
Grenton alarm_control_panel platform.

Exposes a Satel alarm zone (SatelZone) as a native Home Assistant alarm
panel. Arming/disarming uses the zone's ArmZone (execute(0)) / DisarmZone
(execute(1)) methods; the state is read from the Value feature (get(0)).

No code is required in Home Assistant (code_arm_required = False) - the user
code is configured on the Grenton/Satel side.
==================================================
"""

import aiohttp
from .const import (
    CONF_API_ENDPOINT,
    CONF_GRENTON_ID,
    CONF_OBJECT_NAME,
    CONF_AUTO_UPDATE,
    CONF_UPDATE_INTERVAL,
    DEFAULT_UPDATE_INTERVAL,
    DOMAIN
)
from .api import get_api_client, GrentonApiError
from .mixins import GrentonPollingMixin, is_within_debounce
import logging
from homeassistant.components.alarm_control_panel import (
    AlarmControlPanelEntity,
    AlarmControlPanelEntityFeature,
    AlarmControlPanelState
)
from homeassistant.exceptions import HomeAssistantError

_LOGGER = logging.getLogger(__name__)

# SatelZone runtime execute() indices (verified on hardware): ArmZone = 0, DisarmZone = 1.
ARM_ZONE_INDEX = 0
DISARM_ZONE_INDEX = 1


async def async_setup_entry(hass, config_entry, async_add_entities):
    api_endpoint = config_entry.options.get(CONF_API_ENDPOINT, config_entry.data.get(CONF_API_ENDPOINT))
    grenton_id = config_entry.data.get(CONF_GRENTON_ID)
    object_name = config_entry.data.get(CONF_OBJECT_NAME)
    auto_update = config_entry.options.get(CONF_AUTO_UPDATE, config_entry.data.get(CONF_AUTO_UPDATE, True))
    update_interval = config_entry.options.get(CONF_UPDATE_INTERVAL, config_entry.data.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL))

    api_client = get_api_client(hass, api_endpoint)
    entity = GrentonAlarmControlPanel(api_endpoint, grenton_id, object_name, auto_update, update_interval, api_client)
    async_add_entities([entity], True)

    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {"entities": {}}

    hass.data[DOMAIN]["entities"][entity.entity_id] = entity


class GrentonAlarmControlPanel(GrentonPollingMixin, AlarmControlPanelEntity):
    # The Satel user code lives on the Grenton side, so HA never asks for one.
    _attr_code_arm_required = False
    _attr_code_format = None
    _attr_supported_features = AlarmControlPanelEntityFeature.ARM_AWAY

    def __init__(self, api_endpoint, grenton_id, object_name, auto_update, update_interval, api_client):
        self._api_endpoint = api_endpoint
        self._grenton_id = grenton_id
        self._object_name = object_name
        self._state = None
        self._unique_id = f"grenton_{grenton_id.split('->')[1]}"
        self._last_command_time = None
        self._auto_update = auto_update
        self._update_interval = update_interval
        self._unsub_interval = None
        self._initialized = False
        self._api_client = api_client

    async def async_force_state(self, state: int):
        self._state = AlarmControlPanelState.ARMED_AWAY if state == 1 else AlarmControlPanelState.DISARMED
        self.async_write_ha_state()

    @property
    def name(self):
        return self._object_name

    @property
    def unique_id(self):
        return self._unique_id

    @property
    def alarm_state(self):
        return self._state

    @property
    def should_poll(self):
        return False

    async def _send_zone_command(self, index, new_state, action):
        try:
            grenton_id_part_0, grenton_id_part_1 = self._grenton_id.split('->')
            command = {"command": f"{grenton_id_part_0}:execute(0, '{grenton_id_part_1}:execute({index})')"}
            self._state = new_state
            self._last_command_time = self.hass.loop.time() if self.hass is not None else None
            self.async_write_ha_state()

            await self._api_client.send_command(command)
        except (aiohttp.ClientError, GrentonApiError) as ex:
            raise HomeAssistantError(f"Failed to {action} the Satel zone: {ex}") from ex

    async def async_alarm_disarm(self, code=None):
        await self._send_zone_command(DISARM_ZONE_INDEX, AlarmControlPanelState.DISARMED, "disarm")

    async def async_alarm_arm_away(self, code=None):
        await self._send_zone_command(ARM_ZONE_INDEX, AlarmControlPanelState.ARMED_AWAY, "arm")

    async def async_update(self):
        if not self._initialized:
            return

        if is_within_debounce(self._last_command_time, self.hass):
            return

        try:
            grenton_id_part_0, grenton_id_part_1 = self._grenton_id.split('->')
            command = {"status": f"return {grenton_id_part_0}:execute(0, '{grenton_id_part_1}:get(0)')"}
            data = await self._api_client.get_status(command)
            self._handle_update_success()

            if is_within_debounce(self._last_command_time, self.hass):
                return

            self._state = AlarmControlPanelState.DISARMED if data.get("status") == 0 else AlarmControlPanelState.ARMED_AWAY
            self.async_write_ha_state()
        except (aiohttp.ClientError, GrentonApiError) as ex:
            self._handle_update_failure(ex)
