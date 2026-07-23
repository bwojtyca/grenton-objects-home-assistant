import pytest
from custom_components.grenton_objects.binary_sensor import GrentonBinarySensor
from homeassistant.const import STATE_ON, STATE_OFF
from tests.helpers import MockApiClient, MockHass


def create_obj(grenton_id="CLU220000000->DIN0000", grenton_type="DIN", device_class=None, response_data=None, captured_command=None):
    if response_data is None:
        response_data = {"status": 1}
    api_client = MockApiClient(response_data=response_data, captured_command=captured_command)
    obj = GrentonBinarySensor(
        api_endpoint="http://fake-api",
        grenton_id=grenton_id,
        object_name="Test Sensor",
        grenton_type=grenton_type,
        device_class=device_class,
        auto_update=False,
        update_interval=5,
        api_client=api_client
    )
    obj._initialized = True
    obj.hass = MockHass()
    obj.async_write_ha_state = lambda: None

    return obj

@pytest.mark.asyncio
async def test_async_update():
    captured_command = {}
    obj = create_obj(response_data={"status": 1}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DIN0000:get(0)')"
    }
    assert obj._state == STATE_ON
    assert obj.is_on is True
    assert obj.unique_id == "grenton_DIN0000"

@pytest.mark.asyncio
async def test_async_update_off():
    captured_command = {}
    obj = create_obj(response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DIN0000:get(0)')"
    }
    assert obj._state == STATE_OFF
    assert obj.is_on is False
    assert obj.unique_id == "grenton_DIN0000"
@pytest.mark.asyncio
async def test_async_update_satel_input_unknown():
    # Satel objects report -1 when the state is not yet known -> HA "unknown", not "on"
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->SAT0704", grenton_type="SATEL_INPUT", response_data={"status": -1}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'SAT0704:get(0)')"
    }
    assert obj._state is None
    assert obj.is_on is None
    assert obj.unique_id == "grenton_SAT0704"

@pytest.mark.asyncio
async def test_async_update_satel_input_on():
    obj = create_obj(grenton_id="CLU220000000->SAT0704", grenton_type="SATEL_INPUT", response_data={"status": 1})
    await obj.async_update()
    assert obj._state == STATE_ON
    assert obj.is_on is True

@pytest.mark.asyncio
async def test_async_update_satel_input_off():
    obj = create_obj(grenton_id="CLU220000000->SAT0704", grenton_type="SATEL_INPUT", response_data={"status": 0})
    await obj.async_update()
    assert obj._state == STATE_OFF
    assert obj.is_on is False

@pytest.mark.asyncio
async def test_device_class_exposed():
    obj = create_obj(device_class="motion")
    assert obj.device_class == "motion"

@pytest.mark.asyncio
async def test_device_class_defaults_to_none():
    obj = create_obj()
    assert obj.device_class is None
