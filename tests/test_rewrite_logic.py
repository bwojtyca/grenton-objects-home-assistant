"""Unit tests for the .omp push-binding rewrite engine (pure logic)."""
import io
import zipfile

import pytest

from custom_components.grenton_objects import rewrite


def _call(entity, service, source):
    return (
        f'HA_Integration_Queue_Prepare(&quot;{entity}&quot;,'
        f'&quot;{service}&quot;,{source},nil,nil,nil)'
    )


# A tiny system.xml with three push calls: one service typo ("set_brightness ")
# and a swapped pair (button A sources B's object and vice-versa).
SYSTEM_XML = (
    "<object-stream><string>"
    + _call("light.lampa", "set_brightness ", "CLU_clu-&gt;Lampa-&gt;Value")
    + "</string><string>"
    + _call("binary_sensor.a", "set_state", "CLU_clu-&gt;ObjB-&gt;Value")
    + "</string><string>"
    + _call("binary_sensor.b", "set_state", "CLU_clu-&gt;ObjA-&gt;Value")
    + "</string></object-stream>"
)

BACKUP_XML = "<object-stream>untouched backup</object-stream>"


def _make_omp():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("properties.xml", "<x/>")
        archive.writestr("system.xml", SYSTEM_XML)
        archive.writestr("system_backup999.xml", BACKUP_XML)
    return buffer.getvalue()


def _system_xml_of(omp_bytes):
    with zipfile.ZipFile(io.BytesIO(omp_bytes)) as archive:
        return archive.read("system.xml").decode("utf-8")


def test_service_fix_swaps_only_the_service_argument():
    omp = _make_omp()
    result = rewrite.apply_push_fixes(omp, [
        {"target_entity": "light.lampa", "new_service": "set_brightness"},
    ])
    assert len(result["applied"]) == 1
    assert result["skipped"] == []
    text = _system_xml_of(result["omp"])
    assert _call("light.lampa", "set_brightness", "CLU_clu-&gt;Lampa-&gt;Value") in text
    assert "set_brightness &quot;" not in text  # trailing-space typo gone
    # Untouched calls preserved.
    assert _call("binary_sensor.a", "set_state", "CLU_clu-&gt;ObjB-&gt;Value") in text


def test_retarget_swap_is_order_independent():
    omp = _make_omp()
    swap = [
        {"target_entity": "binary_sensor.a", "new_entity": "binary_sensor.b"},
        {"target_entity": "binary_sensor.b", "new_entity": "binary_sensor.a"},
    ]
    for fixes in (swap, list(reversed(swap))):
        result = rewrite.apply_push_fixes(omp, fixes)
        assert len(result["applied"]) == 2, result
        assert result["skipped"] == []
        text = _system_xml_of(result["omp"])
        # After the swap each call's source object matches its (new) target.
        assert _call("binary_sensor.b", "set_state", "CLU_clu-&gt;ObjB-&gt;Value") in text
        assert _call("binary_sensor.a", "set_state", "CLU_clu-&gt;ObjA-&gt;Value") in text


def test_service_and_retarget_on_same_entity_merge():
    omp = _make_omp()
    result = rewrite.apply_push_fixes(omp, [
        {"target_entity": "binary_sensor.a", "new_service": "set_state"},
        {"target_entity": "binary_sensor.a", "new_entity": "binary_sensor.b"},
    ])
    assert len(result["applied"]) == 1  # merged into one edit
    text = _system_xml_of(result["omp"])
    assert _call("binary_sensor.b", "set_state", "CLU_clu-&gt;ObjB-&gt;Value") in text


def test_unknown_entity_is_skipped_not_applied():
    omp = _make_omp()
    result = rewrite.apply_push_fixes(omp, [
        {"target_entity": "light.does_not_exist", "new_service": "set_state"},
    ])
    assert result["applied"] == []
    assert result["skipped"] == [{"target_entity": "light.does_not_exist", "reason": "not_found"}]


def test_no_effective_change_is_skipped():
    omp = _make_omp()
    result = rewrite.apply_push_fixes(omp, [
        {"target_entity": "binary_sensor.a", "new_service": "set_state"},  # already set_state
    ])
    assert result["applied"] == []
    assert result["skipped"] == [{"target_entity": "binary_sensor.a", "reason": "no_change"}]


def test_other_archive_entries_are_byte_identical():
    omp = _make_omp()
    result = rewrite.apply_push_fixes(omp, [
        {"target_entity": "light.lampa", "new_service": "set_brightness"},
    ])
    with zipfile.ZipFile(io.BytesIO(omp)) as before, zipfile.ZipFile(io.BytesIO(result["omp"])) as after:
        assert after.testzip() is None
        assert set(before.namelist()) == set(after.namelist())
        assert before.read("system_backup999.xml") == after.read("system_backup999.xml")
        assert before.read("properties.xml") == after.read("properties.xml")
        assert before.read("system.xml") != after.read("system.xml")


def test_missing_system_xml_raises():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("properties.xml", "<x/>")
    with pytest.raises(ValueError):
        rewrite.apply_push_fixes(buffer.getvalue(), [])


# ─── push event injection ──────────────────────────────────────────────────

# A DALI object with an empty OnDAPCValueChange event, plus an existing push on
# another object (so a queue host CLU..._http can be discovered).
INJECT_XML = (
    '<object-stream>'
    '<Output id="1"><name>Swiatlo_kuchnia___x1_DALI_GEAR_DT8_01</name>'
    '<nameOnCLU>DAL6836</nameOnCLU>'
    '<events id="2"><Event id="3"><name>OnDAPCValueChange</name>'
    '<argList class="linked-list" id="4"/>'
    '<commands class="linked-list" id="5"/>'
    '<customSchemeCommands class="linked-list" id="6"/></Event></events></Output>'
    '<Output id="7"><nameOnCLU>DOU9</nameOnCLU>'
    '<events id="8"><Event id="9"><name>OnValueChange</name>'
    '<commands class="linked-list" id="10">'
    '<string>CLU521002483_http-&gt;HA_Integration_Queue_Prepare(&quot;light.x&quot;,&quot;set_state&quot;,'
    'CLU221011038_clu-&gt;Foo-&gt;Value,nil,nil,nil)</string>'
    '</commands></Event></events></Output>'
    '</object-stream>'
)


def _make_inject_omp():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("properties.xml", "<x/>")
        archive.writestr("system.xml", INJECT_XML)
    return buffer.getvalue()


def _spec(**over):
    base = {
        "obj_id": "DAL6836",
        "om_name": "Swiatlo_kuchnia___x1_DALI_GEAR_DT8_01",
        "clu_ref": "CLU221011038_clu",
        "entity": "light.swiatlo_kuchnia",
        "device_type": "light",
        "grenton_type": "DALI",
        "om_type": "DALI_GEAR_DT8",
    }
    base.update(over)
    return base


def test_inject_fills_empty_dali_event():
    result = rewrite.inject_push_events(_make_inject_omp(), [_spec()])
    assert len(result["applied"]) == 1
    assert result["skipped"] == []
    a = result["applied"][0]
    assert a["event"] == "OnDAPCValueChange" and a["service"] == "set_brightness"
    text = _system_xml_of(result["omp"])
    assert '<commands class="linked-list" id="5"/>' not in text  # empty node filled
    assert ("CLU521002483_http-&gt;HA_Integration_Queue_Prepare(&quot;light.swiatlo_kuchnia&quot;,"
            "&quot;set_brightness&quot;,CLU221011038_clu-&gt;Swiatlo_kuchnia___x1_DALI_GEAR_DT8_01-&gt;"
            "DAPCValue,nil,nil,nil)") in text


def test_inject_uses_discovered_queue_host():
    # The command's host prefix is read from the existing push, not hardcoded.
    result = rewrite.inject_push_events(_make_inject_omp(), [_spec()])
    assert result["applied"][0]["command"].startswith("CLU521002483_http->HA_Integration_Queue_Prepare(")


def test_inject_skips_unknown_object():
    result = rewrite.inject_push_events(_make_inject_omp(), [_spec(obj_id="NOPE")])
    assert result["applied"] == []
    assert result["skipped"] == [{"obj_id": "NOPE", "reason": "event_not_found"}]


def test_inject_skips_unsupported_type():
    result = rewrite.inject_push_events(_make_inject_omp(), [_spec(om_type="RGB", grenton_type="RGB")])
    assert result["applied"] == []
    assert result["skipped"][0]["reason"] == "unsupported_type"


def test_inject_does_not_overwrite_wired_event():
    # DOU9 already has a command → must be skipped, not clobbered.
    spec = _spec(obj_id="DOU9", om_name="Foo", entity="light.y", device_type="switch",
                 grenton_type="DOUT", om_type="DOUT")
    result = rewrite.inject_push_events(_make_inject_omp(), [spec])
    assert result["applied"] == []
    assert result["skipped"][0]["reason"] == "not_empty_or_ambiguous"


def test_inject_cover_is_multi_source():
    xml = INJECT_XML.replace("OnDAPCValueChange", "OnStateChange")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("system.xml", xml)
    spec = _spec(device_type="cover", grenton_type=None, om_type="ROLLER_SHUTTER")
    result = rewrite.inject_push_events(buffer.getvalue(), [spec])
    assert len(result["applied"]) == 1
    cmd = result["applied"][0]["command"]
    assert '"set_cover"' in cmd
    # three sources (State/Position/LamelPosition) then a single trailing nil.
    assert "->State,CLU221011038_clu->" in cmd and "->Position,CLU221011038_clu->" in cmd
    assert cmd.endswith("->LamelPosition,nil)")
