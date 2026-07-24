import pytest
from custom_components.grenton_objects.alarm_control_panel import GrentonAlarmControlPanel
from homeassistant.components.alarm_control_panel import (
    AlarmControlPanelState,
    AlarmControlPanelEntityFeature,
)
from tests.helpers import MockApiClient, MockHass


def create_obj(grenton_id="CLU511002420->SAT8510", response_data=None, captured_command=None):
    if response_data is None:
        response_data = {"status": 0}
    api_client = MockApiClient(response_data=response_data, captured_command=captured_command)
    obj = GrentonAlarmControlPanel(
        api_endpoint="http://fake-api",
        grenton_id=grenton_id,
        object_name="Test Zone",
        auto_update=False,
        update_interval=5,
        api_client=api_client,
    )
    obj._initialized = True
    obj.hass = MockHass()
    obj.async_write_ha_state = lambda: None
    return obj


@pytest.mark.asyncio
async def test_arm_away():
    captured_command = {}
    obj = create_obj(response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_alarm_arm_away()

    # ArmZone = execute(0)
    assert captured_command["value"] == {
        "command": "CLU511002420:execute(0, 'SAT8510:execute(0)')"
    }
    assert obj.alarm_state == AlarmControlPanelState.ARMED_AWAY
    assert obj.unique_id == "grenton_SAT8510"


@pytest.mark.asyncio
async def test_disarm():
    captured_command = {}
    obj = create_obj(response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_alarm_disarm()

    # DisarmZone = execute(1)
    assert captured_command["value"] == {
        "command": "CLU511002420:execute(0, 'SAT8510:execute(1)')"
    }
    assert obj.alarm_state == AlarmControlPanelState.DISARMED


@pytest.mark.asyncio
async def test_update_armed():
    obj = create_obj(response_data={"status": 1})
    await obj.async_update()
    assert obj.alarm_state == AlarmControlPanelState.ARMED_AWAY


@pytest.mark.asyncio
async def test_update_disarmed():
    obj = create_obj(response_data={"status": 0})
    await obj.async_update()
    assert obj.alarm_state == AlarmControlPanelState.DISARMED


@pytest.mark.asyncio
async def test_force_state():
    obj = create_obj()
    await obj.async_force_state(1)
    assert obj.alarm_state == AlarmControlPanelState.ARMED_AWAY
    await obj.async_force_state(0)
    assert obj.alarm_state == AlarmControlPanelState.DISARMED


def test_no_code_required():
    obj = create_obj()
    assert obj.code_arm_required is False
    assert obj.code_format is None
    assert obj.supported_features & AlarmControlPanelEntityFeature.ARM_AWAY
