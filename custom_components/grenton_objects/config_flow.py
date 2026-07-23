"""
==================================================
Author: Jan Nalepka
Script version: 3.8
Date: 09.01.2025
Repository: https://github.com/jnalepka/grenton-objects-home-assistant
==================================================
"""

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from .const import (
    DOMAIN,
    CONF_API_ENDPOINT,
    CONF_GRENTON_ID,
    CONF_OBJECT_NAME,
    CONF_GRENTON_TYPE,
    CONF_GRENTON_TYPE_DOUT,
    CONF_GRENTON_TYPE_DEFAULT_SENSOR,
    CONF_GRENTON_TYPE_RELAY_POWER,
    CONF_GRENTON_TYPE_DIN,
    BINARY_SENSOR_GRENTON_TYPE_OPTIONS,
    SWITCH_GRENTON_TYPE_OPTIONS,
    CONF_DEVICE_CLASS,
    CONF_STATE_CLASS,
    CONF_MIN_VALUE,
    CONF_MAX_VALUE,
    CONF_REVERSED,
    DEVICE_TYPE_OPTIONS,
    DEVICE_CLASS_OPTIONS,
    STATE_CLASS_OPTIONS,
    LIGHT_GRENTON_TYPE_OPTIONS,
    SENSOR_GRENTON_TYPE_OPTIONS,
    LIGHT_GRENTON_TYPE_LED,
    CONF_AUTO_UPDATE,
    CONF_UPDATE_INTERVAL,
    DEFAULT_UPDATE_INTERVAL
)
from .options_flow import GrentonOptionsFlowHandler
from homeassistant.helpers.selector import SelectSelector, SelectSelectorConfig
from homeassistant.components.cover import CoverDeviceClass
from homeassistant.components.binary_sensor import BinarySensorDeviceClass
import logging

_LOGGER = logging.getLogger(__name__)

class GrentonConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1
    def __init__(self):
        self.device_type = None
        self.device_class = None

    async def async_step_user(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="user",
                data_schema=vol.Schema({
                    vol.Required("device_type"): SelectSelector(
                        SelectSelectorConfig(
                            options=DEVICE_TYPE_OPTIONS,
                            translation_key="device_type"
                        )
                    )
                })
            )

        self.device_type = user_input["device_type"]
        if self.device_type == "light":
            return await self.async_step_light_config()
        elif self.device_type == "switch":
            return await self.async_step_switch_config()
        elif self.device_type == "cover":
            return await self.async_step_cover_config()
        elif self.device_type == "climate":
            return await self.async_step_climate_config()
        elif self.device_type == "sensor":
            return await self.async_step_sensor_config()
        elif self.device_type == "binary_sensor":
            return await self.async_step_binary_sensor_config()
        elif self.device_type == "button":
            return await self.async_step_button_config()
        
    def _persist_last_inputs(self, user_input: dict) -> None:
        self.hass.data[f"{DOMAIN}_last_api_endpoint"] = user_input[CONF_API_ENDPOINT]

        grenton_id = user_input.get(CONF_GRENTON_ID)
        if grenton_id and "->" in grenton_id:
            self.hass.data[f"{DOMAIN}_last_grenton_clu_id"] = grenton_id.split("->")[0]

    def _default_api_endpoint(self) -> str:
        # Prefer the endpoint used last in this session, then reuse the endpoint of an
        # already-configured object (config entries persist across restarts, hass.data does
        # not), and only fall back to a hardcoded example when nothing exists yet.
        last = self.hass.data.get(f"{DOMAIN}_last_api_endpoint")
        if last:
            return last
        for entry in self._async_current_entries():
            endpoint = entry.options.get(CONF_API_ENDPOINT, entry.data.get(CONF_API_ENDPOINT))
            if endpoint:
                return endpoint
        return "http://192.168.0.4/HAlistener"

    def _is_duplicate_grenton_id(self, grenton_id: str, grenton_type: str | None = None) -> bool:
        for entry in self._async_current_entries():
            existing_id = entry.data.get(CONF_GRENTON_ID)
            existing_type = entry.data.get(CONF_GRENTON_TYPE)

            if existing_type == CONF_GRENTON_TYPE_RELAY_POWER or grenton_type == CONF_GRENTON_TYPE_RELAY_POWER:
                if existing_id == grenton_id and existing_type == grenton_type:
                    return True
            elif existing_id == grenton_id and existing_type == grenton_type:
                return True
            elif grenton_type not in LIGHT_GRENTON_TYPE_LED and existing_id == grenton_id:
                return True
        return False

    async def async_step_light_config(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="light_config",
                data_schema=self._get_device_schema(user_input)
            )
        
        if self._is_duplicate_grenton_id(user_input[CONF_GRENTON_ID], user_input[CONF_GRENTON_TYPE]):
            return self.async_show_form(
                step_id="light_config",
                data_schema=self._get_device_schema(user_input),
                errors={"base": "duplicate_grenton_id"}
            )

        self._persist_last_inputs(user_input)

        return self.async_create_entry(title=user_input[CONF_OBJECT_NAME], data={
            "device_type": self.device_type,
            CONF_API_ENDPOINT: user_input[CONF_API_ENDPOINT],
            CONF_GRENTON_ID: user_input[CONF_GRENTON_ID],
            CONF_OBJECT_NAME: user_input[CONF_OBJECT_NAME],
            CONF_GRENTON_TYPE: user_input[CONF_GRENTON_TYPE],
            CONF_AUTO_UPDATE: user_input[CONF_AUTO_UPDATE],
            CONF_UPDATE_INTERVAL: user_input[CONF_UPDATE_INTERVAL]
        })
    
    async def async_step_switch_config(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="switch_config",
                data_schema=self._get_device_schema(user_input)
            )
        
        if self._is_duplicate_grenton_id(user_input[CONF_GRENTON_ID]):
            return self.async_show_form(
                step_id="switch_config",
                data_schema=self._get_device_schema(user_input),
                errors={"base": "duplicate_grenton_id"}
            )

        self._persist_last_inputs(user_input)

        return self.async_create_entry(title=user_input[CONF_OBJECT_NAME], data={
            "device_type": self.device_type,
            CONF_API_ENDPOINT: user_input[CONF_API_ENDPOINT],
            CONF_GRENTON_ID: user_input[CONF_GRENTON_ID],
            CONF_OBJECT_NAME: user_input[CONF_OBJECT_NAME],
            CONF_GRENTON_TYPE: user_input.get(CONF_GRENTON_TYPE, CONF_GRENTON_TYPE_DOUT),
            CONF_AUTO_UPDATE: user_input[CONF_AUTO_UPDATE],
            CONF_UPDATE_INTERVAL: user_input[CONF_UPDATE_INTERVAL]
        })

    async def async_step_cover_config(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="cover_config",
                data_schema=self._get_device_schema(user_input)
            )
        
        if self._is_duplicate_grenton_id(user_input[CONF_GRENTON_ID]):
            return self.async_show_form(
                step_id="cover_config",
                data_schema=self._get_device_schema(user_input),
                errors={"base": "duplicate_grenton_id"}
            )

        self._persist_last_inputs(user_input)

        return self.async_create_entry(title=user_input[CONF_OBJECT_NAME], data={
            "device_type": self.device_type,
            CONF_API_ENDPOINT: user_input[CONF_API_ENDPOINT],
            CONF_GRENTON_ID: user_input[CONF_GRENTON_ID],
            CONF_OBJECT_NAME: user_input[CONF_OBJECT_NAME],
            CONF_DEVICE_CLASS: user_input[CONF_DEVICE_CLASS],
            CONF_REVERSED: user_input[CONF_REVERSED],
            CONF_AUTO_UPDATE: user_input[CONF_AUTO_UPDATE],
            CONF_UPDATE_INTERVAL: user_input[CONF_UPDATE_INTERVAL]
        })
    
    async def async_step_climate_config(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="climate_config",
                data_schema=self._get_device_schema(user_input)
            )
        
        if self._is_duplicate_grenton_id(user_input[CONF_GRENTON_ID]):
            return self.async_show_form(
                step_id="climate_config",
                data_schema=self._get_device_schema(user_input),
                errors={"base": "duplicate_grenton_id"}
            )

        self._persist_last_inputs(user_input)

        return self.async_create_entry(title=user_input[CONF_OBJECT_NAME], data={
            "device_type": self.device_type,
            CONF_API_ENDPOINT: user_input[CONF_API_ENDPOINT],
            CONF_GRENTON_ID: user_input[CONF_GRENTON_ID],
            CONF_OBJECT_NAME: user_input[CONF_OBJECT_NAME],
            CONF_UPDATE_INTERVAL: user_input[CONF_UPDATE_INTERVAL]
        })
    
    async def async_step_sensor_config(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="sensor_config",
                data_schema=self._get_device_schema(user_input)
            )
        
        if self._is_duplicate_grenton_id(user_input[CONF_GRENTON_ID], user_input[CONF_GRENTON_TYPE]):
            return self.async_show_form(
                step_id="sensor_config",
                data_schema=self._get_device_schema(user_input),
                errors={"base": "duplicate_grenton_id"}
            )

        min_value = user_input.get(CONF_MIN_VALUE)
        max_value = user_input.get(CONF_MAX_VALUE)
        if min_value is not None and max_value is not None and min_value > max_value:
            return self.async_show_form(
                step_id="sensor_config",
                data_schema=self._get_device_schema(user_input),
                errors={"base": "min_greater_than_max"}
            )

        self._persist_last_inputs(user_input)

        return self.async_create_entry(title=user_input[CONF_OBJECT_NAME], data={
            "device_type": self.device_type,
            CONF_API_ENDPOINT: user_input[CONF_API_ENDPOINT],
            CONF_GRENTON_ID: user_input[CONF_GRENTON_ID],
            CONF_OBJECT_NAME: user_input[CONF_OBJECT_NAME],
            CONF_GRENTON_TYPE: user_input[CONF_GRENTON_TYPE],
            CONF_DEVICE_CLASS: user_input[CONF_DEVICE_CLASS],
            CONF_STATE_CLASS: user_input[CONF_STATE_CLASS],
            CONF_MIN_VALUE: min_value,
            CONF_MAX_VALUE: max_value,
            CONF_AUTO_UPDATE: user_input[CONF_AUTO_UPDATE],
            CONF_UPDATE_INTERVAL: user_input[CONF_UPDATE_INTERVAL]
        })
    
    async def async_step_binary_sensor_config(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="binary_sensor_config",
                data_schema=self._get_device_schema(user_input)
            )
        
        if self._is_duplicate_grenton_id(user_input[CONF_GRENTON_ID]):
            return self.async_show_form(
                step_id="binary_sensor_config",
                data_schema=self._get_device_schema(user_input),
                errors={"base": "duplicate_grenton_id"}
            )

        self._persist_last_inputs(user_input)

        return self.async_create_entry(title=user_input[CONF_OBJECT_NAME], data={
            "device_type": self.device_type,
            CONF_API_ENDPOINT: user_input[CONF_API_ENDPOINT],
            CONF_GRENTON_ID: user_input[CONF_GRENTON_ID],
            CONF_OBJECT_NAME: user_input[CONF_OBJECT_NAME],
            CONF_GRENTON_TYPE: user_input.get(CONF_GRENTON_TYPE, CONF_GRENTON_TYPE_DIN),
            CONF_DEVICE_CLASS: user_input.get(CONF_DEVICE_CLASS),
            CONF_AUTO_UPDATE: user_input[CONF_AUTO_UPDATE],
            CONF_UPDATE_INTERVAL: user_input[CONF_UPDATE_INTERVAL]
        })

    async def async_step_button_config(self, user_input=None):
        if user_input is None:
            return self.async_show_form(
                step_id="button_config",
                data_schema=self._get_device_schema(user_input)
            )
        
        if self._is_duplicate_grenton_id(user_input[CONF_GRENTON_ID]):
            return self.async_show_form(
                step_id="button_config",
                data_schema=self._get_device_schema(user_input),
                errors={"base": "duplicate_grenton_id"}
            )

        self._persist_last_inputs(user_input)

        return self.async_create_entry(title=user_input[CONF_OBJECT_NAME], data={
            "device_type": self.device_type,
            CONF_API_ENDPOINT: user_input[CONF_API_ENDPOINT],
            CONF_GRENTON_ID: user_input[CONF_GRENTON_ID],
            CONF_OBJECT_NAME: user_input[CONF_OBJECT_NAME]
        })
        
    def _get_device_schema(self, user_input=None):
        last_api_endpoint = self._default_api_endpoint()

        defaults = user_input or {}

        if self.device_type == "light":
            return vol.Schema({
                vol.Required(CONF_OBJECT_NAME, default=defaults.get(CONF_OBJECT_NAME, "")): str,
                vol.Required(CONF_API_ENDPOINT, default=defaults.get(CONF_API_ENDPOINT, last_api_endpoint)): str,
                vol.Required(CONF_GRENTON_ID, description={"suggested_value": defaults.get(CONF_GRENTON_ID)}): str,
                vol.Required(CONF_GRENTON_TYPE, default=defaults.get(CONF_GRENTON_TYPE, CONF_GRENTON_TYPE_DOUT)): vol.In(LIGHT_GRENTON_TYPE_OPTIONS),
                vol.Required(CONF_AUTO_UPDATE, default=defaults.get(CONF_AUTO_UPDATE, True)): bool,
                vol.Required(CONF_UPDATE_INTERVAL, default=defaults.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL)): vol.All(vol.Coerce(int), vol.Range(min=5, max=3600))
            })
        elif self.device_type == "switch":
            return vol.Schema({
                vol.Required(CONF_OBJECT_NAME, default=defaults.get(CONF_OBJECT_NAME, "")): str,
                vol.Required(CONF_API_ENDPOINT, default=defaults.get(CONF_API_ENDPOINT, last_api_endpoint)): str,
                vol.Required(CONF_GRENTON_ID, description={"suggested_value": defaults.get(CONF_GRENTON_ID)}): str,
                vol.Required(CONF_GRENTON_TYPE, default=defaults.get(CONF_GRENTON_TYPE, CONF_GRENTON_TYPE_DOUT)): SelectSelector(
                    SelectSelectorConfig(
                        options=SWITCH_GRENTON_TYPE_OPTIONS,
                        translation_key="switch_grenton_type"
                    )
                ),
                vol.Required(CONF_AUTO_UPDATE, default=defaults.get(CONF_AUTO_UPDATE, True)): bool,
                vol.Required(CONF_UPDATE_INTERVAL, default=defaults.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL)): vol.All(vol.Coerce(int), vol.Range(min=5, max=3600))
            })
        elif self.device_type == "cover":
            return vol.Schema({
                vol.Required(CONF_OBJECT_NAME, default=defaults.get(CONF_OBJECT_NAME, "")): str,
                vol.Required(CONF_API_ENDPOINT, default=defaults.get(CONF_API_ENDPOINT, last_api_endpoint)): str,
                vol.Required(CONF_GRENTON_ID, description={"suggested_value": defaults.get(CONF_GRENTON_ID)}): str,
                vol.Required(CONF_DEVICE_CLASS, default=defaults.get(CONF_DEVICE_CLASS, CoverDeviceClass.BLIND.value)): SelectSelector(
                    SelectSelectorConfig(
                        options=[dc.value for dc in CoverDeviceClass],
                        translation_key="device_class"
                    )
                ),
                vol.Required(CONF_REVERSED, default=defaults.get(CONF_REVERSED, False)): bool,
                vol.Required(CONF_AUTO_UPDATE, default=defaults.get(CONF_AUTO_UPDATE, True)): bool,
                vol.Required(CONF_UPDATE_INTERVAL, default=defaults.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL)): vol.All(vol.Coerce(int), vol.Range(min=5, max=3600))
            })
        elif self.device_type == "climate":
            return vol.Schema({
                vol.Required(CONF_OBJECT_NAME, default=defaults.get(CONF_OBJECT_NAME, "")): str,
                vol.Required(CONF_API_ENDPOINT, default=defaults.get(CONF_API_ENDPOINT, last_api_endpoint)): str,
                vol.Required(CONF_GRENTON_ID, description={"suggested_value": defaults.get(CONF_GRENTON_ID)}): str,
                vol.Required(CONF_UPDATE_INTERVAL, default=defaults.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL)): vol.All(vol.Coerce(int), vol.Range(min=5, max=3600))
            })
        elif self.device_type == "sensor":
            return vol.Schema({
                vol.Required(CONF_OBJECT_NAME, default=defaults.get(CONF_OBJECT_NAME, "")): str,
                vol.Required(CONF_API_ENDPOINT, default=defaults.get(CONF_API_ENDPOINT, last_api_endpoint)): str,
                vol.Required(CONF_GRENTON_ID, description={"suggested_value": defaults.get(CONF_GRENTON_ID)}): str,
                vol.Required(CONF_GRENTON_TYPE, default=defaults.get(CONF_GRENTON_TYPE, CONF_GRENTON_TYPE_DEFAULT_SENSOR)): vol.In(SENSOR_GRENTON_TYPE_OPTIONS),
                vol.Required(CONF_DEVICE_CLASS, default=defaults.get(CONF_DEVICE_CLASS, "temperature")): SelectSelector(
                    SelectSelectorConfig(
                        options=DEVICE_CLASS_OPTIONS,
                        translation_key="device_class"
                    )
                ),
                vol.Required(CONF_STATE_CLASS, default=defaults.get(CONF_STATE_CLASS, "measurement")): SelectSelector(
                    SelectSelectorConfig(
                        options=STATE_CLASS_OPTIONS,
                        translation_key="state_class"
                    )
                ),
                vol.Optional(CONF_MIN_VALUE, description={"suggested_value": defaults.get(CONF_MIN_VALUE)}): vol.Coerce(float),
                vol.Optional(CONF_MAX_VALUE, description={"suggested_value": defaults.get(CONF_MAX_VALUE)}): vol.Coerce(float),
                vol.Required(CONF_AUTO_UPDATE, default=defaults.get(CONF_AUTO_UPDATE, True)): bool,
                vol.Required(CONF_UPDATE_INTERVAL, default=defaults.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL)): vol.All(vol.Coerce(int), vol.Range(min=5, max=3600))
            })
        elif self.device_type == "binary_sensor":
            return vol.Schema({
                vol.Required(CONF_OBJECT_NAME, default=defaults.get(CONF_OBJECT_NAME, "")): str,
                vol.Required(CONF_API_ENDPOINT, default=defaults.get(CONF_API_ENDPOINT, last_api_endpoint)): str,
                vol.Required(CONF_GRENTON_ID, description={"suggested_value": defaults.get(CONF_GRENTON_ID)}): str,
                vol.Required(CONF_GRENTON_TYPE, default=defaults.get(CONF_GRENTON_TYPE, CONF_GRENTON_TYPE_DIN)): SelectSelector(
                    SelectSelectorConfig(
                        options=BINARY_SENSOR_GRENTON_TYPE_OPTIONS,
                        translation_key="binary_sensor_grenton_type"
                    )
                ),
                vol.Optional(CONF_DEVICE_CLASS, description={"suggested_value": defaults.get(CONF_DEVICE_CLASS)}): SelectSelector(
                    SelectSelectorConfig(
                        options=[dc.value for dc in BinarySensorDeviceClass],
                        translation_key="binary_sensor_device_class"
                    )
                ),
                vol.Required(CONF_AUTO_UPDATE, default=defaults.get(CONF_AUTO_UPDATE, True)): bool,
                vol.Required(CONF_UPDATE_INTERVAL, default=defaults.get(CONF_UPDATE_INTERVAL, DEFAULT_UPDATE_INTERVAL)): vol.All(vol.Coerce(int), vol.Range(min=5, max=3600))
            })
        elif self.device_type == "button":
            return vol.Schema({
                vol.Required(CONF_OBJECT_NAME, default=defaults.get(CONF_OBJECT_NAME, "")): str,
                vol.Required(CONF_API_ENDPOINT, default=defaults.get(CONF_API_ENDPOINT, last_api_endpoint)): str,
                vol.Required(CONF_GRENTON_ID, description={"suggested_value": defaults.get(CONF_GRENTON_ID)}): str
            })
    
    @staticmethod
    @callback
    def async_get_options_flow(config_entry: config_entries.ConfigEntry) -> GrentonOptionsFlowHandler:
        return GrentonOptionsFlowHandler()