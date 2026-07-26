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
