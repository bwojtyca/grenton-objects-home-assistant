"""
==================================================
Author: Jan Nalepka
Script version: 3.3
Date: 20.10.2025
Repository: https://github.com/jnalepka/grenton-objects-home-assistant
==================================================
"""

import aiohttp
from .const import (
    CONF_API_ENDPOINT,
    CONF_GRENTON_ID,
    CONF_OBJECT_NAME,
    CONF_GRENTON_TYPE,
    CONF_GRENTON_TYPE_DOUT,
    CONF_GRENTON_TYPE_SATEL_OUTPUT,
    CONF_REVERSED,
    CONF_AUTO_UPDATE,
    CONF_UPDATE_INTERVAL,
    DEFAULT_UPDATE_INTERVAL,
    DOMAIN
)
from .api import get_api_client, GrentonApiError
from .mixins import GrentonPollingMixin, is_within_debounce

import logging
from homeassistant.components.switch import (
    SwitchEntity
)
from homeassistant.const import (STATE_ON, STATE_OFF)
from homeassistant.exceptions import HomeAssistantError

_LOGGER = logging.getLogger(__name__)

async def async_setup_entry(hass, config_entry, async_add_entities):
    api_endpoint = config_entry.options.get(CONF_API_ENDPOINT, config_entry.data.get(CONF_API_ENDPOINT))
    grenton_id = config_entry.data.get(CONF_GRENTON_ID)
    object_name = config_entry.data.get(CONF_OBJECT_NAME)
    grenton_type = config_entry.options.get(CONF_GRENTON_TYPE, config_entry.data.get(CONF_GRENTON_TYPE, CONF_GRENTON_TYPE_DOUT))
    reversed_state = config_entry.options.get(CONF_REVERSED, config_entry.data.get(CONF_REVERSED, False))
    auto_update = config_entry.options.get(CONF_AUTO_UPDATE, config_entry.data.get(CONF_AUTO_UPDATE, True))
    update_interval = config_entry.options.get(CONF_UPDATE_INTERVAL, config_entry.data.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL))

    api_client = get_api_client(hass, api_endpoint)
    entity = GrentonSwitch(api_endpoint, grenton_id, object_name, grenton_type, reversed_state, auto_update, update_interval, api_client)
    async_add_entities([entity], True)

    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {"entities": {}}

    hass.data[DOMAIN]["entities"][entity.entity_id] = entity

class GrentonSwitch(GrentonPollingMixin, SwitchEntity):
    def __init__(self, api_endpoint, grenton_id, object_name, grenton_type, reversed_state, auto_update, update_interval, api_client):
        self._api_endpoint = api_endpoint
        self._grenton_id = grenton_id
        self._object_name = object_name
        self._grenton_type = grenton_type
        self._reversed = bool(reversed_state)
        self._state = None
        self._unique_id = f"grenton_{grenton_id.split('->')[1]}"
        self._last_command_time = None
        self._auto_update = auto_update
        self._update_interval = update_interval
        self._unsub_interval = None
        self._initialized = False
        self._api_client = api_client

    async def async_force_state(self, state: int):
        # The pushed value is the physical Grenton Value; invert to the HA state when reversed.
        physical_on = state == 1
        self._state = STATE_ON if (physical_on != self._reversed) else STATE_OFF
        self.async_write_ha_state()

    @property
    def name(self):
        return self._object_name

    @property
    def is_on(self):
        return self._state == STATE_ON

    @property
    def unique_id(self):
        return self._unique_id
    
    @property
    def should_poll(self):
        return False

    def _output_command(self, grenton_id_part_0, grenton_id_part_1, physical_on):
        if self._grenton_type == CONF_GRENTON_TYPE_SATEL_OUTPUT:
            # SatelOutput runtime execute() indices (verified on hardware): SwitchOn = 0,
            # SwitchOff = 1. The Object Manager's method-list order does NOT match these indices.
            index = 0 if physical_on else 1
            return {"command": f"{grenton_id_part_0}:execute(0, '{grenton_id_part_1}:execute({index})')"}
        value = 1 if physical_on else 0
        return {"command": f"{grenton_id_part_0}:execute(0, '{grenton_id_part_1}:set(0, {value})')"}

    async def async_turn_on(self, **kwargs):
        try:
            grenton_id_part_0, grenton_id_part_1 = self._grenton_id.split('->')
            # HA "on" drives the physical output on, or off when the switch is reversed
            command = self._output_command(grenton_id_part_0, grenton_id_part_1, not self._reversed)
            self._state = STATE_ON
            self._last_command_time = self.hass.loop.time() if self.hass is not None else None
            self.async_write_ha_state()
            
            await self._api_client.send_command(command)
        except (aiohttp.ClientError, GrentonApiError) as ex:
            raise HomeAssistantError(f"Failed to turn on the switch: {ex}") from ex

    async def async_turn_off(self, **kwargs):
        try:
            grenton_id_part_0, grenton_id_part_1 = self._grenton_id.split('->')
            # HA "off" drives the physical output off, or on when the switch is reversed
            command = self._output_command(grenton_id_part_0, grenton_id_part_1, self._reversed)
            self._state = STATE_OFF
            self._last_command_time = self.hass.loop.time() if self.hass is not None else None
            self.async_write_ha_state()
            
            await self._api_client.send_command(command)
        except (aiohttp.ClientError, GrentonApiError) as ex:
            raise HomeAssistantError(f"Failed to turn off the switch: {ex}") from ex

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

            physical_on = data.get("status") != 0
            self._state = STATE_ON if (physical_on != self._reversed) else STATE_OFF
            self.async_write_ha_state()
        except (aiohttp.ClientError, GrentonApiError) as ex:
            self._handle_update_failure(ex)
