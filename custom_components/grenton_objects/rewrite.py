"""
==================================================
Targeted, minimal rewrites of an Object Manager project (.omp).

Fixes Grenton→HA push bindings that the analysis (report.py) flagged, by
swapping a single argument inside the existing ``HA_Integration_Queue_Prepare``
calls in ``system.xml`` — NO XStream re-serialization. Every other archive
entry (including the OM backup ``system_backup*.xml``) is copied byte-for-byte.
The caller's original file is never touched; a new byte string is returned to
download and verify in Object Manager.

Each call looks like this in the raw (HTML-escaped) XML::

    HA_Integration_Queue_Prepare(&quot;<entity>&quot;,&quot;<service>&quot;,<source>,nil,nil,nil)

A fix is located by its current target entity (first argument), which is unique
per call, and rewrites the service (second argument) and/or retargets the entity
(first argument). A fix whose exact original call text is not found exactly once
is skipped rather than risk a wrong edit.

Repository: https://github.com/bwojtyca/grenton-objects-home-assistant
==================================================
"""

from __future__ import annotations

import io
import re
import xml.etree.ElementTree as ET
import zipfile

# One push call in the raw (escaped) system.xml. The source expression contains
# no ')' in practice (it is an object path like CLU..._clu-&gt;Name-&gt;Value),
# so a non-greedy up-to-')' capture is safe; a call that does not fit this shape
# simply will not match and is left untouched.
_CALL_RE = re.compile(
    r'HA_Integration_Queue_Prepare\(\s*&quot;(?P<entity>[^&]+)&quot;\s*,'
    r'\s*&quot;(?P<service>[^&]*)&quot;\s*,'
    r'(?P<source>[^,)]+)(?P<rest>[^)]*)\)'
)


def _build_call(entity: str, service: str, source: str, rest: str) -> str:
    return (
        f'HA_Integration_Queue_Prepare(&quot;{entity}&quot;,'
        f'&quot;{service}&quot;,{source}{rest})'
    )


def find_push_calls(system_xml_text: str) -> dict:
    """Index every push call by its target entity (first argument)."""
    calls = {}
    for match in _CALL_RE.finditer(system_xml_text):
        entity = match.group("entity")
        calls[entity] = {
            "entity": entity,
            "service": match.group("service"),
            "source": match.group("source"),
            "rest": match.group("rest"),
            "raw": match.group(0),
        }
    return calls


def _system_xml_member(names: list[str]) -> str | None:
    """The archive member holding the live project (not a *_backup*.xml)."""
    for name in names:
        base = name.rsplit("/", 1)[-1]
        if base == "system.xml":
            return name
    return None


def apply_push_fixes(omp_bytes: bytes, fixes: list[dict]) -> dict:
    """Apply push-binding fixes to a .omp and return a corrected copy.

    ``fixes`` is a list of ``{"target_entity", "new_service"?, "new_entity"?}``.
    Returns ``{"omp": <bytes>, "applied": [...], "skipped": [...]}``. Each
    skipped entry carries a ``reason`` (``not_found`` / ``not_unique`` /
    ``no_change``). Raises ``ValueError`` if the archive has no ``system.xml``.
    """
    with zipfile.ZipFile(io.BytesIO(omp_bytes)) as archive:
        infos = archive.infolist()
        member = _system_xml_member(archive.namelist())
        if member is None:
            raise ValueError("system.xml not found in archive")
        contents = {info.filename: archive.read(info.filename) for info in infos}

    text = contents[member].decode("utf-8")
    # Index once, from the ORIGINAL text. Every fix is matched against the
    # original call it was derived from — never re-indexed mid-run — so a swap
    # (two calls retargeted onto each other's entity) cannot race on a
    # transiently duplicated target key. Merge fixes per entity so a service +
    # retarget on the same call apply together as one edit.
    calls = find_push_calls(text)
    merged: dict[str, dict] = {}
    order: list[str] = []
    for fix in fixes:
        target = fix.get("target_entity")
        if target not in merged:
            merged[target] = {"target_entity": target}
            order.append(target)
        if fix.get("new_service"):
            merged[target]["new_service"] = fix["new_service"]
        if fix.get("new_entity"):
            merged[target]["new_entity"] = fix["new_entity"]

    applied: list[dict] = []
    skipped: list[dict] = []
    for target in order:
        fix = merged[target]
        call = calls.get(target)
        if call is None:
            skipped.append({"target_entity": target, "reason": "not_found"})
            continue
        old = call["raw"]
        if text.count(old) != 1:
            skipped.append({"target_entity": target, "reason": "not_unique"})
            continue
        new_entity = fix.get("new_entity") or call["entity"]
        new_service = fix.get("new_service") or call["service"]
        new = _build_call(new_entity, new_service, call["source"], call["rest"])
        if new == old:
            skipped.append({"target_entity": target, "reason": "no_change"})
            continue
        text = text.replace(old, new, 1)
        applied.append({
            "target_entity": target,
            "new_entity": new_entity,
            "new_service": new_service,
            "old": old,
            "new": new,
        })

    contents[member] = text.encode("utf-8")

    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as archive:
        for info in infos:
            # Preserve each entry's name, timestamp and compression by reusing
            # its ZipInfo; only system.xml's payload changes.
            archive.writestr(info, contents[info.filename])
    return {"omp": out.getvalue(), "applied": applied, "skipped": skipped}


# ── Grenton→HA push event injection ─────────────────────────────────────────
#
# A push binding is a call to HA_Integration_Queue_Prepare placed in the state
# event of a Grenton object. Every object already ships that event node with an
# EMPTY commands list; wiring a push in Object Manager just fills it with one
# command string. We reproduce exactly that: fill the empty
#   <commands class="linked-list" id="X"/>
# with a single <string>…</string>, located by the object's nameOnCLU and the
# event name — nothing else in the archive changes. Verified byte-for-byte
# against Object Manager's own export.
#
# The command has a fixed 6-argument signature (README "All Grenton services"):
#   HA_Integration_Queue_Prepare(entity, service, value_1, value_2, value_3, string_value)
# Single-source objects fill value_1 only (rest nil); a roller fills
# State/Position/LamelPosition. The event name and source feature(s) come from
# the object's OM type; the service from the HA device/grenton type.

# OM object type → (state event name, [source feature(s)]). Verified against the
# user's working project. RGB/RGB+W are intentionally absent — they map the
# source into string_value and there is no verified template yet.
_PUSH_EVENT_BY_OM_TYPE = {
    "DALI_GEAR": ("OnDAPCValueChange", ["DAPCValue"]),
    "DALI_GEAR_DT8": ("OnDAPCValueChange", ["DAPCValue"]),
    "ROLLER_SHUTTER": ("OnStateChange", ["State", "Position", "LamelPosition"]),
    "DIN": ("OnChange", ["Value"]),
    "SatelInput": ("OnChange", ["Value"]),
    "SatelOutput": ("OnChange", ["Value"]),
    "SatelZone": ("OnChange", ["Value"]),
    "DOUT": ("OnValueChange", ["Value"]),
    "LED_CHANNEL": ("OnValueChange", ["Value"]),
    "ONEW_SENSOR": ("OnValueChange", ["Value"]),
    "ANALOG_OUT": ("OnValueChange", ["Value"]),
    "ANALOG_IN": ("OnValueChange", ["Value"]),
}


def _push_service(device_type: str | None, grenton_type: str | None) -> str:
    if device_type == "cover":
        return "set_cover"
    if device_type == "sensor":
        return "set_value"
    if device_type == "light" and grenton_type in ("DALI", "DIMMER", "LED", "LED_CHANNEL"):
        return "set_brightness"
    return "set_state"  # switch / binary_sensor / DOUT-as-light


def push_recipe(om_type: str | None, device_type: str | None, grenton_type: str | None):
    """(event_name, [features], service) for a push binding, or None when the
    object type has no verified injection template (e.g. RGB/RGB+W)."""
    entry = _PUSH_EVENT_BY_OM_TYPE.get(om_type or "")
    if entry is None and om_type and om_type.startswith("DALI") and "MASTER" not in om_type:
        entry = ("OnDAPCValueChange", ["DAPCValue"])
    if entry is None:
        return None
    event_name, features = entry
    return event_name, features, _push_service(device_type, grenton_type)


_XML_ESCAPES = (("&", "&amp;"), ("<", "&lt;"), (">", "&gt;"), ('"', "&quot;"))


def _xml_escape(text: str) -> str:
    for raw, escaped in _XML_ESCAPES:
        text = text.replace(raw, escaped)
    return text


def build_push_command(queue_host: str, entity: str, service: str,
                       clu_ref: str, om_name: str, features: list[str]) -> str:
    """The unescaped Lua command, e.g.
    CLU..._http->HA_Integration_Queue_Prepare("light.x","set_brightness",
        CLU..._clu->Name->DAPCValue,nil,nil,nil)."""
    slots = [f"{clu_ref}->{om_name}->{feature}" for feature in features]
    slots += ["nil"] * (4 - len(slots))  # pad to value_1..value_3 + string_value
    args = f'"{entity}","{service}",' + ",".join(slots)
    return f"{queue_host}->HA_Integration_Queue_Prepare({args})"


def find_queue_host(system_xml_text: str) -> str | None:
    """The CLU object hosting HA_Integration_Queue_Prepare (e.g. CLU..._http),
    read from any existing push call."""
    match = re.search(r'(CLU\d+_http)-&gt;HA_Integration_Queue_Prepare', system_xml_text)
    return match.group(1) if match else None


def _find_commands_id(root, resolve, obj_id: str, event_name: str) -> str | None:
    """The XStream id of the (resolved) commands list of ``obj_id``'s
    ``event_name`` event, or None if the object/event is absent."""
    for element in root.iter():
        name_on_clu = element.find("nameOnCLU")
        if name_on_clu is None or (name_on_clu.text or "").strip() != obj_id:
            continue
        events = element.find("events")
        if events is None:
            return None
        for event in resolve(events).findall("Event"):
            name = event.find("name")
            if name is not None and (name.text or "").strip() == event_name:
                commands = event.find("commands")
                return resolve(commands).get("id") if commands is not None else None
        return None
    return None


def _indent_before(text: str, needle: str) -> str:
    index = text.find(needle)
    return text[text.rfind("\n", 0, index) + 1:index]


def inject_push_events(omp_bytes: bytes, specs: list[dict]) -> dict:
    """Wire Grenton→HA push events into a .omp for objects not yet pushing.

    Each spec is ``{"obj_id", "om_name", "clu_ref", "entity", "device_type",
    "grenton_type", "om_type"}``. Only an EMPTY event command list is filled —
    never overwritten — so an already-wired or ambiguous object is skipped with
    a reason (``unsupported_type`` / ``no_queue_host`` / ``event_not_found`` /
    ``not_empty_or_ambiguous``). Returns ``{"omp", "applied", "skipped"}``.
    """
    with zipfile.ZipFile(io.BytesIO(omp_bytes)) as archive:
        infos = archive.infolist()
        member = _system_xml_member(archive.namelist())
        if member is None:
            raise ValueError("system.xml not found in archive")
        contents = {info.filename: archive.read(info.filename) for info in infos}

    text = contents[member].decode("utf-8")
    queue_host = find_queue_host(text)
    root = ET.fromstring(contents[member])
    by_id = {el.get("id"): el for el in root.iter() if el.get("id")}

    def resolve(element):
        ref = element.get("reference")
        return by_id.get(ref, element) if ref is not None else element

    applied: list[dict] = []
    skipped: list[dict] = []
    for spec in specs:
        obj_id = spec.get("obj_id")
        recipe = push_recipe(spec.get("om_type"), spec.get("device_type"), spec.get("grenton_type"))
        if recipe is None:
            skipped.append({"obj_id": obj_id, "reason": "unsupported_type"})
            continue
        if not queue_host:
            skipped.append({"obj_id": obj_id, "reason": "no_queue_host"})
            continue
        event_name, features, service = recipe
        commands_id = _find_commands_id(root, resolve, obj_id, event_name)
        if not commands_id:
            skipped.append({"obj_id": obj_id, "reason": "event_not_found"})
            continue
        empty = f'<commands class="linked-list" id="{commands_id}"/>'
        if text.count(empty) != 1:  # already wired, or shared/ambiguous → don't touch
            skipped.append({"obj_id": obj_id, "reason": "not_empty_or_ambiguous"})
            continue
        command = build_push_command(
            queue_host, spec["entity"], service, spec["clu_ref"], spec["om_name"], features
        )
        indent = _indent_before(text, empty)
        filled = (
            f'<commands class="linked-list" id="{commands_id}">\n'
            f'{indent}  <string>{_xml_escape(command)}</string>\n'
            f'{indent}</commands>'
        )
        text = text.replace(empty, filled, 1)
        applied.append({
            "obj_id": obj_id,
            "entity": spec["entity"],
            "event": event_name,
            "service": service,
            "command": command,
        })

    contents[member] = text.encode("utf-8")
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as archive:
        for info in infos:
            archive.writestr(info, contents[info.filename])
    return {"omp": out.getvalue(), "applied": applied, "skipped": skipped}
