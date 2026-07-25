"""
==================================================
Grenton project reconciliation report.

Parses a Grenton Object Manager project archive (``.omp`` — a ZIP containing
``system.xml``) and reconciles it against the live Home Assistant configuration
of this integration: which Grenton objects are exposed in HA, which are not, and
which entities update by polling versus by push (Grenton-side events).

The parsing and reconciliation are pure functions (no Home Assistant imports at
module level) so they can be unit-tested in isolation. Only ``collect_ha_objects``
reads live HA state.

Repository: https://github.com/bwojtyca/grenton-objects-home-assistant
==================================================
"""

from __future__ import annotations

import html
import io
import re
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter

# Grenton object-id prefixes that denote a real controllable/readable object
# (the part after "->" in a grenton_id, e.g. DOU5553, ROL7324, SAT1234).
_OBJECT_ID_RE = re.compile(
    r"^(DOU|DIN|ROL|LED|DIM|ZWA|ONE|TEM|ANA|PAN|MOD|DAL|SEN|THE|PWM|ADC|VAL|FLA|PRE|PID|SAT)[0-9A-Za-z]"
)
# Top-level tree containers are named like "CLU221011038_clu" / "CLU511002420_alarm".
_CLU_CONTAINER_RE = re.compile(r"^(CLU\d+)_")
# Grenton→HA push events are wired as calls to HA_Integration_Queue_Prepare in
# object event bindings, e.g.
#   CLU..._http->HA_Integration_Queue_Prepare("binary_sensor.x","set_state",CLU..._alarm->Obj->Value,nil,nil,nil)
_PUSH_EVENT_RE = re.compile(
    r'HA_Integration_Queue_Prepare\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*([^,)]+)'
)

# Object types that are pure inputs (wall buttons / alarm inputs driving Grenton
# logic). They are rarely meant to be Home Assistant entities, so they are kept
# out of the "missing from HA" list to avoid noise (but still counted).
_INPUT_ONLY_TYPES = {"DIN", "SatelInput", "Satel"}


# ─── OM project parsing ─────────────────────────────────────────────────────

def parse_omp(file_path: str) -> dict:
    """Parse a ``.omp`` archive on disk. See :func:`parse_omp_bytes`."""
    with open(file_path, "rb") as handle:
        return parse_omp_bytes(handle.read())


def parse_omp_bytes(data: bytes) -> dict:
    """Parse ``.omp`` archive bytes and return the Grenton project inventory.

    Returns ``{"objects": [...], "push_events": [...], "clus": [...]}``.
    Raises ``ValueError`` if the archive is not a valid OM project.
    """
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            member = next(
                (n for n in archive.namelist() if n.rsplit("/", 1)[-1] == "system.xml"),
                None,
            )
            if member is None:
                raise ValueError("system.xml not found in archive")
            xml_bytes = archive.read(member)
    except zipfile.BadZipFile as err:
        raise ValueError("not a valid .omp (ZIP) archive") from err

    return parse_system_xml(xml_bytes)


def parse_system_xml(xml_bytes: bytes) -> dict:
    """Parse the raw ``system.xml`` payload into objects, push events and CLUs."""
    text = xml_bytes.decode("utf-8", errors="replace")
    root = ET.fromstring(xml_bytes)

    # Index every element by its XStream id so 'reference' attributes resolve.
    by_id = {el.get("id"): el for el in root.iter() if el.get("id")}

    def resolve(element):
        ref = element.get("reference")
        return by_id.get(ref, element) if ref else element

    def child_text(element, tag):
        node = element.find(tag)
        if node is not None and node.text and node.text.strip():
            return node.text.strip()
        return None

    objects: list[dict] = []
    clus: dict[str, dict] = {}

    def walk(tree_object, clu):
        name = child_text(tree_object, "name")
        match = _CLU_CONTAINER_RE.match(name) if name else None
        if match:
            clu = match.group(1)

        spec = tree_object.find("specificObject")
        if spec is not None:
            spec = resolve(spec)
            # A CLU definition carries an <ipAddress>; record it for the topology.
            clu_node = spec.find("clu")
            if clu_node is not None:
                serial = child_text(clu_node, "nameOnCLU")
                if serial:
                    clus.setdefault(serial, {"clu": serial, "ip": child_text(clu_node, "ipAddress")})
            name_on_clu = child_text(spec, "nameOnCLU")
            obj_type = child_text(spec, "type") or child_text(spec, "typeName")
            if name_on_clu and _OBJECT_ID_RE.match(name_on_clu) and not name_on_clu.startswith("CLU"):
                objects.append({
                    "clu": clu,
                    "obj_id": name_on_clu,
                    "grenton_id": f"{clu}->{name_on_clu}" if clu else name_on_clu,
                    "name": child_text(spec, "name"),
                    "type": obj_type,
                })

        children = tree_object.find("children")
        if children is not None:
            for sub in children.findall("TreeObject"):
                walk(sub, clu)

    for tree_object in root.findall("TreeObject"):
        walk(tree_object, None)

    # Deduplicate objects that are referenced from multiple tree locations.
    unique: dict[str, dict] = {}
    for obj in objects:
        unique.setdefault(obj["grenton_id"], obj)

    # Extract Grenton→HA push event bindings.
    unescaped = html.unescape(text)
    push_events = []
    for ha_entity, service, source in _PUSH_EVENT_RE.findall(unescaped):
        parts = source.strip().split("->")
        push_events.append({
            "ha_entity": ha_entity,
            "service": service,
            "src_obj": parts[1] if len(parts) >= 2 else source.strip(),
        })

    return {
        "objects": list(unique.values()),
        "push_events": push_events,
        "clus": sorted(clus.values(), key=lambda c: c["clu"]),
    }


# ─── grenton_id normalization ───────────────────────────────────────────────

def _normalize_grenton_id(grenton_id: str | None) -> str | None:
    """Reduce a grenton_id to ``CLU<serial>-><object_id>`` for robust joins.

    HA stores e.g. ``CLU221011038->ROL7324`` while OM containers may carry a
    suffix; both collapse to the CLU serial + object id.
    """
    if not grenton_id:
        return None
    match = re.match(r"(CLU\d+)\D*->(.+)", grenton_id)
    if match:
        return f"{match.group(1)}->{match.group(2)}"
    return grenton_id.split("->")[-1]


def _object_id(grenton_id: str | None) -> str | None:
    return grenton_id.split("->")[-1] if grenton_id else None


# ─── Live HA state collection (the only HA-coupled function) ────────────────

def collect_ha_objects(hass) -> list[dict]:
    """Read this integration's config entries + entity registry into plain dicts."""
    from homeassistant.helpers import area_registry as ar
    from homeassistant.helpers import entity_registry as er

    from .const import (
        CONF_API_ENDPOINT,
        CONF_AUTO_UPDATE,
        CONF_GRENTON_ID,
        CONF_GRENTON_TYPE,
        CONF_OBJECT_NAME,
        CONF_UPDATE_INTERVAL,
        DOMAIN,
    )

    entity_reg = er.async_get(hass)
    area_reg = ar.async_get(hass)
    result = []

    for entry in hass.config_entries.async_entries(DOMAIN):
        data, options = entry.data, entry.options

        def effective(key, default=None, _data=data, _options=options):
            return _options.get(key, _data.get(key, default))

        entities = er.async_entries_for_config_entry(entity_reg, entry.entry_id)
        entity = entities[0] if entities else None

        area_name = None
        if entity and entity.area_id:
            area = area_reg.async_get_area(entity.area_id)
            area_name = area.name if area else entity.area_id

        result.append({
            "entry_id": entry.entry_id,
            "entity_id": entity.entity_id if entity else None,
            "name": data.get(CONF_OBJECT_NAME) or entry.title,
            "device_type": data.get("device_type"),
            "grenton_id": data.get(CONF_GRENTON_ID),
            "grenton_type": effective(CONF_GRENTON_TYPE),
            "endpoint": effective(CONF_API_ENDPOINT),
            "auto_update": effective(CONF_AUTO_UPDATE, True),
            "update_interval": effective(CONF_UPDATE_INTERVAL),
            "area": area_name,
            "hidden": bool(entity.hidden_by) if entity else False,
            "disabled": bool(entity.disabled_by) if entity else False,
        })

    return result


# ─── Reconciliation (pure) ──────────────────────────────────────────────────

def build_report(om_objects: list[dict], push_events: list[dict], ha_objects: list[dict]) -> dict:
    """Reconcile the OM project against the HA configuration.

    All inputs are plain lists of dicts (see ``parse_omp`` / ``collect_ha_objects``)
    so this stays pure and unit-testable.
    """
    om_by_norm = {}
    om_by_object_id = {}
    for obj in om_objects:
        om_by_norm[_normalize_grenton_id(obj["grenton_id"])] = obj
        om_by_object_id[_object_id(obj["grenton_id"])] = obj

    push_targets = {event["ha_entity"] for event in push_events}

    rows = []
    for ha in ha_objects:
        grenton_id = ha.get("grenton_id")
        om_obj = om_by_norm.get(_normalize_grenton_id(grenton_id)) or om_by_object_id.get(_object_id(grenton_id))
        entity_id = ha.get("entity_id")
        mode = "polling" if ha.get("auto_update", True) else "push"
        rows.append({
            "entity_id": entity_id,
            "name": ha.get("name"),
            "device_type": ha.get("device_type"),
            "grenton_id": grenton_id,
            "grenton_type": ha.get("grenton_type"),
            "endpoint": ha.get("endpoint"),
            "mode": mode,
            "interval": ha.get("update_interval") if mode == "polling" else None,
            "area": ha.get("area"),
            "hidden": ha.get("hidden"),
            "disabled": ha.get("disabled"),
            "in_om": om_obj is not None,
            "om_name": om_obj["name"] if om_obj else None,
            "om_type": om_obj["type"] if om_obj else None,
            "has_push_event": bool(entity_id) and entity_id in push_targets,
        })

    # Reconciliation buckets.
    orphans = [r for r in rows if not r["in_om"]]
    push_no_event = [r for r in rows if r["mode"] == "push" and not r["has_push_event"]]
    poll_with_push = [r for r in rows if r["mode"] == "polling" and r["has_push_event"]]

    ha_entity_ids = {r["entity_id"] for r in rows if r["entity_id"]}
    push_orphan_targets = sorted(push_targets - ha_entity_ids)

    ha_norm_ids = {_normalize_grenton_id(r["grenton_id"]) for r in rows}
    not_in_ha = [
        obj for obj in om_objects
        if obj["type"] not in _INPUT_ONLY_TYPES
        and _normalize_grenton_id(obj["grenton_id"]) not in ha_norm_ids
    ]
    input_not_in_ha = [
        obj for obj in om_objects
        if obj["type"] in _INPUT_ONLY_TYPES
        and _normalize_grenton_id(obj["grenton_id"]) not in ha_norm_ids
    ]

    # Per-domain polling/push breakdown.
    per_domain = {}
    for r in rows:
        bucket = per_domain.setdefault(r["device_type"], {"polling": 0, "push": 0})
        bucket[r["mode"]] += 1

    # Merged union of every OM object and every HA entry, keyed by normalized
    # grenton_id. This is the single source for the "all objects" table.
    ha_by_norm = {}
    for r in rows:
        ha_by_norm.setdefault(_normalize_grenton_id(r["grenton_id"]), r)

    merged = []
    seen_norm = set()
    for obj in om_objects:
        norm = _normalize_grenton_id(obj["grenton_id"])
        seen_norm.add(norm)
        r = ha_by_norm.get(norm)
        is_input = obj["type"] in _INPUT_ONLY_TYPES
        flags = []
        if r is None and not is_input:
            flags.append("not_in_ha")
        if r is not None:
            if r["mode"] == "push" and not r["has_push_event"]:
                flags.append("push_no_event")
            if r["mode"] == "polling" and r["has_push_event"]:
                flags.append("poll_redundant")
        merged.append({
            "grenton_id": obj["grenton_id"],
            "clu": obj.get("clu"),
            "om_name": obj["name"],
            "om_type": obj["type"],
            "is_input": is_input,
            "in_om": True,
            "in_ha": r is not None,
            "entity_id": r["entity_id"] if r else None,
            "ha_name": r["name"] if r else None,
            "device_type": r["device_type"] if r else None,
            "mode": r["mode"] if r else None,
            "interval": r["interval"] if r else None,
            "area": r["area"] if r else None,
            "flags": flags,
        })

    for r in rows:
        if _normalize_grenton_id(r["grenton_id"]) not in seen_norm:
            merged.append({
                "grenton_id": r["grenton_id"],
                "clu": None,
                "om_name": None,
                "om_type": None,
                "is_input": False,
                "in_om": False,
                "in_ha": True,
                "entity_id": r["entity_id"],
                "ha_name": r["name"],
                "device_type": r["device_type"],
                "mode": r["mode"],
                "interval": r["interval"],
                "area": r["area"],
                "flags": ["orphan"],
            })

    verdict = "ok" if not (orphans or push_no_event or push_orphan_targets) else "issues"

    return {
        "verdict": verdict,
        "summary": {
            "ha_total": len(rows),
            "om_total": len(om_objects),
            "push_events": len(push_events),
            "polling": sum(1 for r in rows if r["mode"] == "polling"),
            "push": sum(1 for r in rows if r["mode"] == "push"),
            "by_device_type": Counter(r["device_type"] for r in rows).most_common(),
            "per_domain": per_domain,
            "endpoints": Counter(r["endpoint"] for r in rows).most_common(),
            "om_by_type": Counter(o["type"] for o in om_objects).most_common(),
        },
        "orphans": orphans,
        "push_no_event": push_no_event,
        "poll_with_push": poll_with_push,
        "push_orphan_targets": push_orphan_targets,
        "not_in_ha": not_in_ha,
        "not_in_ha_by_type": Counter(o["type"] for o in not_in_ha).most_common(),
        "input_not_in_ha_count": len(input_not_in_ha),
        "rows": rows,
        "merged": merged,
    }
