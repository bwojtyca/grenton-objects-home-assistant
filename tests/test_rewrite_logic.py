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
