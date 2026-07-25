"""Unit tests for the OM project reconciliation report (pure logic)."""
import io
import zipfile

import pytest

from custom_components.grenton_objects import report


# ─── Synthetic OM project (minimal system.xml) ─────────────────────────────

SYSTEM_XML = """<object-stream>
  <TreeObject id="1">
    <name>System</name>
    <children id="2">
      <TreeObject id="3">
        <name>CLU221011038_clu</name>
        <specificObject class="HardwarePeripheryCLU" id="99">
          <clu id="98">
            <nameOnCLU>CLU221011038</nameOnCLU>
            <ipAddress>192.168.1.10</ipAddress>
          </clu>
        </specificObject>
        <children id="4">
          <TreeObject id="5">
            <name>Lampa</name>
            <specificObject class="Output" id="6">
              <name>Lampa salon</name>
              <nameOnCLU>DOU1234</nameOnCLU>
              <type>DOUT</type>
            </specificObject>
            <children id="7"/>
          </TreeObject>
          <TreeObject id="8">
            <name>Roleta</name>
            <specificObject class="Output" id="9">
              <name>Roleta salon</name>
              <nameOnCLU>ROL5678</nameOnCLU>
              <type>ROLLER_SHUTTER</type>
            </specificObject>
            <children id="10"/>
          </TreeObject>
          <TreeObject id="11">
            <name>Przycisk</name>
            <specificObject class="Input" id="12">
              <name>Przycisk salon</name>
              <nameOnCLU>DIN0001</nameOnCLU>
              <type>DIN</type>
            </specificObject>
            <children id="13"/>
          </TreeObject>
        </children>
      </TreeObject>
      <TreeObject id="20">
        <name>CLU521002483_http</name>
        <children id="21">
          <TreeObject id="22">
            <name>Event</name>
            <specificObject class="Output" id="24">
              <name>evt</name>
              <events id="25">
                <string>CLU521002483_http-&gt;HA_Integration_Queue_Prepare(&quot;light.lampa_salon&quot;,&quot;set_state&quot;,CLU221011038_clu-&gt;Lampa-&gt;Value,nil,nil,nil)</string>
              </events>
            </specificObject>
            <children id="26"/>
          </TreeObject>
        </children>
      </TreeObject>
    </children>
  </TreeObject>
</object-stream>"""


def _make_omp(bytes_io=None):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("system.xml", SYSTEM_XML)
        archive.writestr("properties.xml", "<x/>")
    return buffer.getvalue()


# ─── parse ──────────────────────────────────────────────────────────────────

def test_parse_system_xml_extracts_objects_and_clu_context():
    parsed = report.parse_system_xml(SYSTEM_XML.encode("utf-8"))
    by_id = {o["grenton_id"]: o for o in parsed["objects"]}

    assert "CLU221011038->DOU1234" in by_id
    assert by_id["CLU221011038->DOU1234"]["type"] == "DOUT"
    assert by_id["CLU221011038->ROL5678"]["type"] == "ROLLER_SHUTTER"
    assert by_id["CLU221011038->DIN0001"]["type"] == "DIN"


def test_parse_system_xml_extracts_clu_topology():
    parsed = report.parse_system_xml(SYSTEM_XML.encode("utf-8"))
    clus = {c["clu"]: c for c in parsed["clus"]}
    assert clus["CLU221011038"]["ip"] == "192.168.1.10"


def test_parse_system_xml_extracts_push_events():
    parsed = report.parse_system_xml(SYSTEM_XML.encode("utf-8"))
    assert len(parsed["push_events"]) == 1
    event = parsed["push_events"][0]
    assert event["ha_entity"] == "light.lampa_salon"
    assert event["service"] == "set_state"
    assert event["src_obj"] == "Lampa"


def test_parse_omp_reads_zip(tmp_path):
    omp = tmp_path / "project.omp"
    omp.write_bytes(_make_omp())
    parsed = report.parse_omp(str(omp))
    assert len(parsed["objects"]) == 3


def test_parse_omp_bytes_reads_zip():
    parsed = report.parse_omp_bytes(_make_omp())
    assert len(parsed["objects"]) == 3
    assert len(parsed["push_events"]) == 1


def test_parse_omp_bytes_rejects_non_zip():
    with pytest.raises(ValueError):
        report.parse_omp_bytes(b"not a zip")


def test_parse_omp_rejects_non_zip(tmp_path):
    bad = tmp_path / "bad.omp"
    bad.write_text("not a zip")
    with pytest.raises(ValueError):
        report.parse_omp(str(bad))


# ─── reconcile ────────────────────────────────────────────────────────────

def _scenario():
    om_objects = [
        {"clu": "CLU1", "obj_id": "DOU1", "grenton_id": "CLU1->DOU1", "name": "L1", "type": "DOUT"},
        {"clu": "CLU1", "obj_id": "ROL1", "grenton_id": "CLU1->ROL1", "name": "R1", "type": "ROLLER_SHUTTER"},
        {"clu": "CLU1", "obj_id": "DOU2", "grenton_id": "CLU1->DOU2", "name": "L2", "type": "DOUT"},
        {"clu": "CLU1", "obj_id": "DOU3", "grenton_id": "CLU1->DOU3", "name": "L3", "type": "DOUT"},
        {"clu": "CLU1", "obj_id": "DOU5", "grenton_id": "CLU1->DOU5", "name": "L5", "type": "DOUT"},
        {"clu": "CLU1", "obj_id": "DOU9", "grenton_id": "CLU1->DOU9", "name": "L9", "type": "DOUT"},
        {"clu": "CLU1", "obj_id": "DIN1", "grenton_id": "CLU1->DIN1", "name": "B1", "type": "DIN"},
        {"clu": "CLU1", "obj_id": "DIN2", "grenton_id": "CLU1->DIN2", "name": "B2", "type": "DIN"},
        {"clu": "CLU1", "obj_id": "DAL1", "grenton_id": "CLU1->DAL1", "name": "Master", "type": "DALI_MASTER"},
    ]
    push_events = [
        {"ha_entity": "light.l1", "service": "set_state", "src_obj": "L1"},
        {"ha_entity": "light.l2poll", "service": "set_state", "src_obj": "L2"},
        {"ha_entity": "binary_sensor.ghost", "service": "set_state", "src_obj": "X"},
        {"ha_entity": "light.badservice", "service": "set_cover", "src_obj": "L3"},  # wrong service for light
        {"ha_entity": "switch.wrongobj", "service": "set_state", "src_obj": "L1"},  # L1 != DOU5
    ]
    ha_objects = [
        {"entity_id": "light.l1", "name": "L1", "device_type": "light",
         "grenton_id": "CLU1->DOU1", "auto_update": False},
        {"entity_id": "cover.r1", "name": "R1", "device_type": "cover",
         "grenton_id": "CLU1->ROL1", "auto_update": False},
        {"entity_id": "sensor.din1", "name": "B1", "device_type": "binary_sensor",
         "grenton_id": "CLU1->DIN1", "auto_update": True},
        {"entity_id": "switch.orphan", "name": "O", "device_type": "switch",
         "grenton_id": "CLU1->DOU404", "auto_update": True},
        {"entity_id": "light.l2poll", "name": "L2", "device_type": "light",
         "grenton_id": "CLU1->DOU2", "auto_update": True, "update_interval": 30},
        {"entity_id": "light.badservice", "name": "L3", "device_type": "light",
         "grenton_id": "CLU1->DOU3", "auto_update": False},
        {"entity_id": "switch.wrongobj", "name": "L5", "device_type": "switch",
         "grenton_id": "CLU1->DOU5", "auto_update": False},
    ]
    return report.build_report(om_objects, push_events, ha_objects, {"HA_Integration_Listener"})


def test_build_report_buckets():
    result = _scenario()
    assert result["verdict"] == "issues"
    assert [r["entity_id"] for r in result["orphans"]] == ["switch.orphan"]
    assert [r["entity_id"] for r in result["push_no_event"]] == ["cover.r1"]
    assert result["push_orphan_targets"] == ["binary_sensor.ghost"]
    assert [r["entity_id"] for r in result["poll_with_push"]] == ["light.l2poll"]


def test_build_report_push_service_mismatch():
    result = _scenario()
    assert [m["ha_entity"] for m in result["push_service_mismatch"]] == ["light.badservice"]


def test_build_report_push_object_mismatch():
    result = _scenario()
    assert len(result["push_object_mismatch"]) == 1
    m = result["push_object_mismatch"][0]
    assert m["ha_entity"] == "switch.wrongobj"
    assert m["entity_grenton_id"] == "CLU1->DOU5"
    assert m["source_grenton_id"] == "CLU1->DOU1"


def test_build_report_not_in_ha_includes_din_excludes_unsupported():
    result = _scenario()
    not_in_ha_ids = {o["grenton_id"] for o in result["not_in_ha"]}
    assert not_in_ha_ids == {"CLU1->DOU9", "CLU1->DIN2"}  # DIN now counted, no special-casing
    assert not any(o["type"] == "DALI_MASTER" for o in result["not_in_ha"])  # unsupported excluded
    assert result["unsupported_count"] == 1


def test_build_report_type_summary():
    summary = {t["type"]: t for t in _scenario()["type_summary"]}
    assert summary["DOUT"]["count"] == 5
    assert summary["DOUT"]["supported"] is True
    assert summary["DIN"]["supported"] is True
    assert summary["DALI_MASTER"]["supported"] is False


def test_build_report_scaffolding():
    # project_names has the listener but not the script → one required item missing.
    result = _scenario()
    missing = {m["name"] for m in result["scaffolding"]["missing"]}
    assert "HA_Integration_Script" in missing
    assert "HA_Integration_Listener" not in missing


def test_build_report_clean_verdict():
    om_objects = [{"clu": "CLU1", "obj_id": "DOU1", "grenton_id": "CLU1->DOU1", "name": "L1", "type": "DOUT"}]
    push_events = [{"ha_entity": "light.l1", "service": "set_state", "src_obj": "L1"}]
    ha_objects = [{"entity_id": "light.l1", "name": "L1", "device_type": "light",
                   "grenton_id": "CLU1->DOU1", "auto_update": False}]
    result = report.build_report(om_objects, push_events, ha_objects)  # no project_names → skip scaffolding
    assert result["verdict"] == "ok"
    assert result["scaffolding"] is None


# ─── merged (union) table ───────────────────────────────────────────────────

def test_build_report_merged_flags_and_fields():
    merged = _scenario()["merged"]
    by_id = {r["grenton_id"]: r for r in merged}

    assert by_id["CLU1->DOU1"]["in_ha"] is True and by_id["CLU1->DOU1"]["flags"] == []
    assert by_id["CLU1->ROL1"]["flags"] == ["push_no_event"]
    assert by_id["CLU1->DOU2"]["flags"] == ["poll_redundant"]
    assert by_id["CLU1->DOU3"]["flags"] == ["push_bad_service"]
    assert by_id["CLU1->DOU5"]["flags"] == ["push_wrong_object"]
    assert by_id["CLU1->DOU9"]["flags"] == ["not_in_ha"]
    assert by_id["CLU1->DIN2"]["is_din"] is True and by_id["CLU1->DIN2"]["flags"] == ["not_in_ha"]
    assert by_id["CLU1->DAL1"]["is_unsupported"] is True and by_id["CLU1->DAL1"]["flags"] == []

    orphan = by_id["CLU1->DOU404"]
    assert orphan["in_om"] is False and orphan["flags"] == ["orphan"]


def test_build_report_is_json_serializable():
    import json
    json.dumps(_scenario())  # must not raise
