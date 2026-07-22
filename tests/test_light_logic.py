import pytest
from custom_components.grenton_objects.light import GrentonLight
from homeassistant.const import STATE_ON, STATE_OFF
from tests.helpers import MockApiClient, MockHass


def create_obj(grenton_id="CLU220000000->DOU0000", grenton_type = "DOUT", response_data=None, captured_command=None):
    if response_data is None:
        response_data = {"status": "ok"}
    api_client = MockApiClient(response_data=response_data, captured_command=captured_command)
    obj = GrentonLight(
        api_endpoint="http://fake-api",
        grenton_id=grenton_id,
        object_name="Test obj",
        grenton_type = grenton_type,
        auto_update=False,
        update_interval=5,
        api_client=api_client
    )
    obj._initialized = True
    obj.hass = MockHass()
    obj.async_write_ha_state = lambda: None

    return obj

@pytest.mark.asyncio
async def test_async_turn_on_dout():
    captured_command = {}
    obj = create_obj(grenton_type = "DOUT", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DOU0000:set(0, 1)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_DOU0000"

@pytest.mark.asyncio
async def test_async_turn_on_dimmer():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DIM0000", grenton_type = "DIMMER", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DIM0000:set(0, 1.0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_DIM0000"

@pytest.mark.asyncio
async def test_async_turn_on_dali():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DAL0000", grenton_type="DALI", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DAL0000:execute(1, 254, 0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_DAL0000"

@pytest.mark.asyncio
async def test_async_turn_on_dali_custom_brightness():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DAL0000", grenton_type="DALI", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on(brightness=128)

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DAL0000:execute(1, 127, 0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 128
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_DAL0000"

@pytest.mark.asyncio
async def test_async_turn_on_dimmer_zwave():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->ZWA0000", grenton_type = "DIMMER", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'ZWA0000:execute(0, 255)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_ZWA0000"

@pytest.mark.asyncio
async def test_async_turn_on_dimmer_rgbw_r():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "LED_R", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'LED0000:execute(3, 255)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_LED0000_LED_R"

@pytest.mark.asyncio
async def test_async_turn_on_dimmer_rgbw_g():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "LED_G", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'LED0000:execute(4, 255)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_LED0000_LED_G"

@pytest.mark.asyncio
async def test_async_turn_on_dimmer_rgbw_b():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "LED_B", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'LED0000:execute(5, 255)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_LED0000_LED_B"

@pytest.mark.asyncio
async def test_async_turn_on_dimmer_rgbw_w():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "LED_W", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'LED0000:execute(12, 255)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_LED0000_LED_W"

@pytest.mark.asyncio
async def test_async_turn_on_rgb():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->RGB0000", grenton_type = "RGB", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on(rgb_color=[255, 255, 255])

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'RGB0000:execute(6, \\\"#ffffff\\\")')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.rgb_color == [255, 255, 255]
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_RGB0000"

@pytest.mark.asyncio
async def test_async_turn_on_rgb_zwave():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->ZWA0000", grenton_type = "RGB", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on(rgb_color=[0, 0, 0])

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'ZWA0000:execute(3, \\\"#000000\\\")')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.rgb_color == [0, 0, 0]
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_ZWA0000"

@pytest.mark.asyncio
async def test_async_turn_on_rgb_no_rgb_color():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->RGB0000", grenton_type = "RGB", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'RGB0000:execute(0, 1.0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_RGB0000"

@pytest.mark.asyncio
async def test_async_turn_on_led():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type="LED", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'LED0000:execute(0, 1.0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_LED0000"

@pytest.mark.asyncio
async def test_async_turn_off_dout():
    captured_command = {}
    obj = create_obj(grenton_type = "DOUT", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DOU0000:set(0, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_DOU0000"

@pytest.mark.asyncio
async def test_async_turn_off_dimmer():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DIM0000", grenton_type = "DIMMER", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DIM0000:set(0, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_DIM0000"

@pytest.mark.asyncio
async def test_async_turn_off_led():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type="LED", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'LED0000:execute(0, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_LED0000"

@pytest.mark.asyncio
async def test_async_turn_off_dali():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DAL0000", grenton_type="DALI", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DAL0000:execute(1, 0, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_DAL0000"

@pytest.mark.asyncio
async def test_async_turn_off_dimmer_zwave():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->ZWA0000", grenton_type = "DIMMER", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'ZWA0000:execute(0, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_ZWA0000"

@pytest.mark.asyncio
async def test_async_turn_off_rgb():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->RGB0000", grenton_type = "RGB", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'RGB0000:execute(0, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_RGB0000"

@pytest.mark.asyncio
async def test_async_turn_off_rgb_led_r():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->RGB0000", grenton_type = "LED_R", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'RGB0000:execute(3, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_RGB0000_LED_R"

@pytest.mark.asyncio
async def test_async_turn_off_rgb_led_g():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->RGB0000", grenton_type = "LED_G", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'RGB0000:execute(4, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_RGB0000_LED_G"

@pytest.mark.asyncio
async def test_async_turn_off_rgb_led_b():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->RGB0000", grenton_type = "LED_B", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'RGB0000:execute(5, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_RGB0000_LED_B"

@pytest.mark.asyncio
async def test_async_turn_off_rgb_led_w():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->RGB0000", grenton_type = "LED_W", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'RGB0000:execute(12, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_RGB0000_LED_W"

@pytest.mark.asyncio
async def test_async_update_dout():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DOU0000", grenton_type = "DOUT", response_data={"status": 1}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DOU0000:get(0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.unique_id == "grenton_DOU0000"

@pytest.mark.asyncio
async def test_async_update_dout_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DOU0000", grenton_type = "DOUT", response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DOU0000:get(0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj.unique_id == "grenton_DOU0000"

@pytest.mark.asyncio
async def test_async_update_dimmer():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DIM0000", grenton_type = "DIMMER", response_data={"status": 1}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DIM0000:get(0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj.unique_id == "grenton_DIM0000"

@pytest.mark.asyncio
async def test_async_update_led():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type="LED", response_data={"status": 1}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'LED0000:get(0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj.unique_id == "grenton_LED0000"

@pytest.mark.asyncio
async def test_async_update_led_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type="LED", response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'LED0000:get(0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj.unique_id == "grenton_LED0000"

@pytest.mark.asyncio
async def test_async_update_dali():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DAL0000", grenton_type="DALI", response_data={"status": 254}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DAL0000:get(2)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj.unique_id == "grenton_DAL0000"

@pytest.mark.asyncio
async def test_async_update_dali_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DAL0000", grenton_type="DALI", response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DAL0000:get(2)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj.brightness == 0
    assert obj.unique_id == "grenton_DAL0000"

@pytest.mark.asyncio
async def test_async_update_dimmer_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DIM0000", grenton_type = "DIMMER", response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'DIM0000:get(0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj.brightness == 0
    assert obj.unique_id == "grenton_DIM0000"

@pytest.mark.asyncio
async def test_async_update_dimmer_zwave():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->ZWA0000", grenton_type = "DIMMER", response_data={"status": 255}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'ZWA0000:get(0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj.unique_id == "grenton_ZWA0000"

@pytest.mark.asyncio
async def test_async_update_dimmer_zwave_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->ZWA0000", grenton_type = "DIMMER", response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'ZWA0000:get(0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj.brightness == 0
    assert obj.unique_id == "grenton_ZWA0000"

@pytest.mark.asyncio
async def test_async_update_led_r():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "LED_R", response_data={"status": 255}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'LED0000:get(3)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj.unique_id == "grenton_LED0000_LED_R"

@pytest.mark.asyncio
async def test_async_update_led_g_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "LED_G", response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'LED0000:get(4)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj.brightness == 0
    assert obj.unique_id == "grenton_LED0000_LED_G"

@pytest.mark.asyncio
async def test_async_update_led_b_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "LED_B", response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'LED0000:get(5)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj.brightness == 0
    assert obj.unique_id == "grenton_LED0000_LED_B"

@pytest.mark.asyncio
async def test_async_update_led_w():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "LED_W", response_data={"status": 255}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'LED0000:get(15)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj.unique_id == "grenton_LED0000_LED_W"

@pytest.mark.asyncio
async def test_async_update_rgb():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "RGB", response_data={"status": 1, "status_2": "#000000"}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'LED0000:get(0)')", "status_2": "return CLU220000000:execute(0, 'LED0000:get(6)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj.rgb_color == [0, 0, 0]
    assert obj.unique_id == "grenton_LED0000"

@pytest.mark.asyncio
async def test_async_update_rgb_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED0000", grenton_type = "RGB", response_data={"status": 0, "status_2": "#ffffff"}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'LED0000:get(0)')", "status_2": "return CLU220000000:execute(0, 'LED0000:get(6)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj.brightness == 0
    assert obj.rgb_color == [255, 255, 255]
    assert obj.unique_id == "grenton_LED0000"

@pytest.mark.asyncio
async def test_async_update_rgb_zwave():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->ZWA0000", grenton_type = "RGB", response_data={"status": 1, "status_2": "#ffffff"}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'ZWA0000:get(0)')", "status_2": "return CLU220000000:execute(0, 'ZWA0000:get(3)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj.rgb_color == [255, 255, 255]
    assert obj.unique_id == "grenton_ZWA0000"

@pytest.mark.asyncio
async def test_async_force_brightness_dali():
    obj = create_obj(grenton_id="CLU220000000->DAL0000", grenton_type="DALI", response_data={"status": "ok"})
    await obj.async_force_brightness(254)

    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj.unique_id == "grenton_DAL0000"

@pytest.mark.asyncio
async def test_async_force_brightness_dali_off():
    obj = create_obj(grenton_id="CLU220000000->DAL0000", grenton_type="DALI", response_data={"status": "ok"})
    await obj.async_force_brightness(0)

    assert not obj.is_on
    assert obj._state == STATE_OFF
    assert obj.brightness == 0
    assert obj.unique_id == "grenton_DAL0000"

# --- DALI conversion edge cases (value == 1) ---

def test_ha_to_dali_brightness_edge():
    # HA minimum brightness (1) must map to the dimmest DAPC (1), NOT full (254)
    assert GrentonLight._ha_to_dali_brightness(0) == 0
    assert GrentonLight._ha_to_dali_brightness(1) == 1
    assert GrentonLight._ha_to_dali_brightness(128) == 127
    assert GrentonLight._ha_to_dali_brightness(255) == 254

def test_normalize_dali_brightness_raw_vs_fraction():
    # Raw DAPCValue 0-254: value of 1 stays 1 (not read as 100%)
    assert GrentonLight._normalize_dali_brightness(0) == 0
    assert GrentonLight._normalize_dali_brightness(1) == 1
    assert GrentonLight._normalize_dali_brightness(127) == 127
    assert GrentonLight._normalize_dali_brightness(254) == 254
    assert GrentonLight._normalize_dali_brightness(300) == 254
    # Strictly-below-1 values are treated as a 0.00-1.00 fraction
    assert GrentonLight._normalize_dali_brightness(0.5) == 127

@pytest.mark.asyncio
async def test_async_turn_on_dali_min_brightness():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->DAL0000", grenton_type="DALI", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on(brightness=1)

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'DAL0000:execute(1, 1, 0)')"
    }
    assert obj.is_on

@pytest.mark.asyncio
async def test_async_force_brightness_dali_raw_one():
    # A raw DAPCValue of 1 from OnDAPCValueChange -> dim, not full
    obj = create_obj(grenton_id="CLU220000000->DAL0000", grenton_type="DALI", response_data={"status": "ok"})
    await obj.async_force_brightness(1)

    assert obj.is_on
    assert obj.brightness == 1
# --- LED_CHANNEL (standalone single PWM channel; Value 0-255, SetValue = method index 0) ---

@pytest.mark.asyncio
async def test_async_turn_on_led_channel():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED5946", grenton_type="LED_CHANNEL", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'LED5946:execute(0, 255)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 255
    assert obj._last_command_time == 123.456
    assert obj.unique_id == "grenton_LED5946"

@pytest.mark.asyncio
async def test_async_turn_on_led_channel_custom_brightness():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED5946", grenton_type="LED_CHANNEL", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_on(brightness=128)

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'LED5946:execute(0, 128)')"
    }
    assert obj.brightness == 128

@pytest.mark.asyncio
async def test_async_turn_off_led_channel():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED5946", grenton_type="LED_CHANNEL", response_data={"status": "ok"}, captured_command=captured_command)
    await obj.async_turn_off()

    assert captured_command["value"] == {
        "command": "CLU220000000:execute(0, 'LED5946:execute(0, 0)')"
    }
    assert not obj.is_on
    assert obj._state == STATE_OFF

@pytest.mark.asyncio
async def test_async_update_led_channel():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED5946", grenton_type="LED_CHANNEL", response_data={"status": 200}, captured_command=captured_command)
    await obj.async_update()

    assert captured_command["value"] == {
        "status": "return CLU220000000:execute(0, 'LED5946:get(0)')"
    }
    assert obj.is_on
    assert obj._state == STATE_ON
    assert obj.brightness == 200
    assert obj.unique_id == "grenton_LED5946"

@pytest.mark.asyncio
async def test_async_update_led_channel_off():
    captured_command = {}
    obj = create_obj(grenton_id="CLU220000000->LED5946", grenton_type="LED_CHANNEL", response_data={"status": 0}, captured_command=captured_command)
    await obj.async_update()

    assert not obj.is_on
    assert obj._state == STATE_OFF

@pytest.mark.asyncio
async def test_async_force_brightness_led_channel():
    obj = create_obj(grenton_id="CLU220000000->LED5946", grenton_type="LED_CHANNEL", response_data={"status": "ok"})
    await obj.async_force_brightness(200)

    assert obj.is_on
    assert obj.brightness == 200
