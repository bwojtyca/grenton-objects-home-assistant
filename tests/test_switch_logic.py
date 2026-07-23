import pytest
from custom_components.grenton_objects.switch import GrentonSwitch
from homeassistant.const import STATE_ON, STATE_OFF
from tests.helpers import MockApiClient, MockHass


def create_obj(grenton_id="CLU220000000->DIN0000", grenton_type="DOUT", response_data=None, captured_command=None):
    if response_data is None:
        response_data = {"status": 1}
    api_client = MockApiClient(response_data=response_data, captured_command=captured_command)
    obj = GrentonSwitch(
        api_endpoint="http://fake-api",
        grenton_id=grenton_id,
        object_name="Test Sensor",
        grenton_type=grenton_type,
        auto_update=False,
        update_interval=5,
        api_client=api_client
    )
    obj._initialized = True
    obj.hass = MockHass()
    obj.async_write_ha_state = lambda: None

    return obj

@pytest.mark.asyncio
async def test_async_turn_on():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DOU0000", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DOU0000:set(0, 1)')"
    }
    assert obj._state == STATE_ON
    assert obj.is_on is True
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_DOU0000"

@pytest.mark.asyncio
async def test_async_turn_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DOU0000", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DOU0000:set(0, 0)')"
    }
    assert obj._state == STATE_OFF
    assert obj.is_on is not True
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_DOU0000"

@pytest.mark.asyncio
async def test_async_update():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DOU0000", response_data={"status": 1}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DOU0000:get(0)')"
    }
    assert obj._state == STATE_ON
    assert obj.is_on is True
    assert obj.unique_id == "grenton_DOU0000"

@pytest.mark.asyncio
async def test_async_update_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DOU0000", response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DOU0000:get(0)')"
    }
    assert obj._state == STATE_OFF
    assert obj.is_on is not True
    assert obj.unique_id == "grenton_DOU0000"
@pytest.mark.asyncio
async def test_async_update_keeps_state_and_goes_unavailable_after_failures():
    from custom_components.grenton_objects.api import GrentonApiError
    from custom_components.grenton_objects.const import GATE_FAILURE_THRESHOLD
    obj = create_obj(grenton_id="CLU220000000->DOU0000", response_data={"status": 1})
    await obj.async_update()
    assert obj.is_on is True
    assert obj.available is True

    async def _raise(_query):
        raise GrentonApiError("Connection timeout to host")
    obj._api_client.get_status = _raise

    for _ in range(GATE_FAILURE_THRESHOLD - 1):
        await obj.async_update()
        assert obj.available is True
        assert obj.is_on is True            # last state kept, not blanked

    await obj.async_update()
    assert obj.available is False
    assert obj.is_on is True                # state retained while unavailable

# --- SatelOutput (switch): SwitchOn = execute(2), SwitchOff = execute(3), read get(0) ---

@pytest.mark.asyncio
async def test_async_turn_on_satel_output():
    captured_command = {}
    obj = create_obj(grenton_id="CLU511002420->SAT7310", grenton_type="SATEL_OUTPUT", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU511002420:execute(0, 'SAT7310:execute(2)')"
    }
    assert obj._state == STATE_ON
    assert obj.is_on is True
    assert obj.unique_id == "grenton_SAT7310"

@pytest.mark.asyncio
async def test_async_turn_off_satel_output():
    captured_command = {}
    obj = create_obj(grenton_id="CLU511002420->SAT7310", grenton_type="SATEL_OUTPUT", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU511002420:execute(0, 'SAT7310:execute(3)')"
    }
    assert obj._state == STATE_OFF
    assert obj.is_on is not True

@pytest.mark.asyncio
async def test_async_update_satel_output():
    captured_command = {}
    obj = create_obj(grenton_id="CLU511002420->SAT7310", grenton_type="SATEL_OUTPUT", response_data={"status": 1}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU511002420:execute(0, 'SAT7310:get(0)')"
    }
    assert obj._state == STATE_ON
    assert obj.is_on is True
