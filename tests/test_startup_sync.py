"""Tests for the on-add startup state sync in GrentonPollingMixin.

After a Home Assistant restart every entity should seed its state from Grenton
once — including push entities (auto_update off), which previously stayed
Unknown until the device physically changed and emitted a push event.
"""

import pytest
from homeassistant.const import STATE_ON, STATE_OFF

from custom_components.grenton_objects import mixins
from custom_components.grenton_objects.switch import GrentonSwitch
from tests.helpers import MockApiClient


class MockLoop:
    def time(self):
        return 100.0


class MockHass:
    loop = MockLoop()


def _make_switch(auto_update, response):
    obj = GrentonSwitch(
        api_endpoint="http://fake-api",
        grenton_id="CLU220000000->DOU0000",
        object_name="Test Switch",
        grenton_type="DOUT",
        reversed_state=False,
        auto_update=auto_update,
        update_interval=30,
        api_client=MockApiClient(response_data=response),
    )
    obj.hass = MockHass()
    obj.async_write_ha_state = lambda: None
    return obj


@pytest.mark.asyncio
async def test_push_entity_syncs_state_on_add():
    """A push entity (auto_update off) reads its state once on add and does not
    schedule a recurring poll."""
    obj = _make_switch(auto_update=False, response={"status": 1})
    assert obj._state is None

    await obj.async_added_to_hass()

    assert obj._initialized is True
    assert obj._state == STATE_ON        # one-shot startup read happened
    assert obj._unsub_interval is None   # push: no polling interval scheduled


@pytest.mark.asyncio
async def test_polling_entity_syncs_state_and_schedules_interval(monkeypatch):
    """A polling entity reads on add AND schedules the recurring interval."""
    scheduled = {}

    def fake_track(hass, cb, interval):
        scheduled["interval"] = interval
        scheduled["cb"] = cb
        return "unsub-sentinel"

    monkeypatch.setattr(mixins, "async_track_time_interval", fake_track)

    obj = _make_switch(auto_update=True, response={"status": 0})
    await obj.async_added_to_hass()

    assert obj._state == STATE_OFF                    # startup read happened
    assert obj._unsub_interval == "unsub-sentinel"    # recurring poll scheduled
    assert scheduled["interval"].total_seconds() == 30
