"""Tests for GrentonApiClient command and status batching logic."""

import asyncio
import aiohttp
import pytest
from unittest.mock import AsyncMock, MagicMock

from custom_components.grenton_objects.api import GrentonApiClient, GrentonApiError


def _make_mock_session(response_data):
    """Create a mock aiohttp session with a preconfigured POST response."""
    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = AsyncMock(return_value=response_data)
    mock_response.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response.__aexit__ = AsyncMock(return_value=False)

    mock_session = MagicMock()
    mock_session.post = MagicMock(return_value=mock_response)
    return mock_session


def _make_status_session(record=None, track=None, delay=0.0, fail_on=None):
    """Mock aiohttp session whose GET echoes the request payload.

    - record: list each sent payload is appended to
    - track:  dict {"cur":0,"max":0} recording observed max concurrency
    - delay:  seconds each request "takes" (to observe concurrency)
    - fail_on: predicate(payload)->bool; when True the request raises ClientError
    """

    class _Resp:
        def __init__(self, payload):
            self._payload = payload

        async def __aenter__(self):
            if track is not None:
                track["cur"] += 1
                track["max"] = max(track["max"], track["cur"])
            if delay:
                await asyncio.sleep(delay)
            return self

        async def __aexit__(self, *args):
            if track is not None:
                track["cur"] -= 1
            return False

        def raise_for_status(self):
            if fail_on is not None and fail_on(self._payload):
                raise aiohttp.ClientError("boom")

        async def json(self):
            return {"g_status": "OK", **{k: f"r::{v}" for k, v in self._payload.items()}}

    def _get(url, json=None, timeout=None):
        if record is not None:
            record.append(json)
        return _Resp(json)

    mock_session = MagicMock()
    mock_session.get = MagicMock(side_effect=_get)
    return mock_session


@pytest.mark.asyncio
async def test_single_command_sends_one_post():
    """A single send_command should result in exactly one POST with key 'command'."""
    mock_session = _make_mock_session({"command": "OK"})
    client = GrentonApiClient("http://fake-gate", mock_session, batch_window=0.0)

    result = await client.send_command({"command": "CLU:execute(0, 'DOU:set(0, 1)')"})

    assert result == {"command": "OK"}
    mock_session.post.assert_called_once()
    payload = mock_session.post.call_args[1]["json"]
    assert payload == {"command": "CLU:execute(0, 'DOU:set(0, 1)')"}


@pytest.mark.asyncio
async def test_concurrent_commands_batched_into_single_post():
    """Multiple send_command calls in the same tick should merge into one POST."""
    mock_session = _make_mock_session({
        "command": "result_1",
        "command_2": "result_2",
        "command_3": "result_3",
    })
    client = GrentonApiClient("http://fake-gate", mock_session, batch_window=0.0)

    # Fire three commands concurrently (same event-loop tick)
    results = await asyncio.gather(
        client.send_command({"command": "cmd_a"}),
        client.send_command({"command": "cmd_b"}),
        client.send_command({"command": "cmd_c"}),
    )

    # Should have been a single POST
    assert mock_session.post.call_count == 1
    payload = mock_session.post.call_args[1]["json"]
    # Payload should contain command, command_2, command_3
    assert "command" in payload
    assert "command_2" in payload
    assert "command_3" in payload

    # Each caller gets its correct result
    assert results[0] == {"command": "result_1"}
    assert results[1] == {"command": "result_2"}
    assert results[2] == {"command": "result_3"}


@pytest.mark.asyncio
async def test_multi_key_command_batched_correctly():
    """A command dict with multiple keys should generate sequential numbered keys."""
    mock_session = _make_mock_session({
        "command": "res_a",
        "command_2": "res_b",
    })
    client = GrentonApiClient("http://fake-gate", mock_session, batch_window=0.0)

    result = await client.send_command({
        "command": "set_temp",
        "command_2": "set_mode",
    })

    assert result == {"command": "res_a", "command_2": "res_b"}
    payload = mock_session.post.call_args[1]["json"]
    assert payload == {"command": "set_temp", "command_2": "set_mode"}


@pytest.mark.asyncio
async def test_failure_rejects_all_futures_with_grenton_api_error():
    """When POST fails with a non-aiohttp error, futures get GrentonApiError."""
    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = AsyncMock(side_effect=ValueError("bad json"))
    mock_response.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response.__aexit__ = AsyncMock(return_value=False)

    mock_session = MagicMock()
    mock_session.post = MagicMock(return_value=mock_response)

    client = GrentonApiClient("http://fake-gate", mock_session, batch_window=0.0)

    with pytest.raises(GrentonApiError):
        await client.send_command({"command": "some_cmd"})


@pytest.mark.asyncio
async def test_batch_window_coalesces_staggered_commands():
    """With a non-zero batch window, commands arriving within it are merged."""
    mock_session = _make_mock_session({
        "command": "r1",
        "command_2": "r2",
    })
    client = GrentonApiClient("http://fake-gate", mock_session, batch_window=0.05)

    # Send first command
    task1 = asyncio.create_task(client.send_command({"command": "cmd_1"}))
    # Small delay then send second (within batch window)
    await asyncio.sleep(0.01)
    task2 = asyncio.create_task(client.send_command({"command": "cmd_2"}))

    results = await asyncio.gather(task1, task2)

    # Both should be in a single POST
    assert mock_session.post.call_count == 1
    assert results[0] == {"command": "r1"}
    assert results[1] == {"command": "r2"}


@pytest.mark.asyncio
async def test_concurrent_status_reads_coalesce_into_one_request():
    """Reads fired within the batch window merge into a single GET, and each
    caller gets back a dict keyed by its own query keys."""
    record = []
    session = _make_status_session(record=record)
    client = GrentonApiClient("http://fake-gate", session, status_batch_window=0.02)

    results = await asyncio.gather(
        client.get_status({"status": "qA"}),
        client.get_status({"status": "qB"}),
        client.get_status({"status": "qC"}),
    )

    assert session.get.call_count == 1
    # Wire payload renumbers keys; first key stays "status" for the gate guard.
    assert record[0] == {"status": "qA", "status_2": "qB", "status_3": "qC"}
    # Each caller is demultiplexed back to its own result.
    assert results == [
        {"status": "r::qA"},
        {"status": "r::qB"},
        {"status": "r::qC"},
    ]


@pytest.mark.asyncio
async def test_multi_key_status_query_batched_and_preserved():
    """A single caller with several logical keys (e.g. RGBW: status/status_2/
    status_3) gets all of them back under the original names."""
    record = []
    session = _make_status_session(record=record)
    client = GrentonApiClient("http://fake-gate", session, status_batch_window=0.0)

    result = await client.get_status({"status": "s0", "status_2": "s6", "status_3": "s15"})

    assert result == {"status": "r::s0", "status_2": "r::s6", "status_3": "r::s15"}
    assert record[0] == {"status": "s0", "status_2": "s6", "status_3": "s15"}


@pytest.mark.asyncio
async def test_status_reads_are_chunked_and_serialized():
    """A restart burst of many reads is split into chunks of at most
    max_gets_per_request, sent one at a time (never concurrently), and every
    caller still receives its correct result."""
    track = {"cur": 0, "max": 0}
    session = _make_status_session(track=track, delay=0.01)
    client = GrentonApiClient(
        "http://fake-gate", session, status_batch_window=0.02, max_gets_per_request=20
    )

    results = await asyncio.gather(
        *[client.get_status({"status": f"q{i}"}) for i in range(50)]
    )

    # 50 reads → chunks of 20, 20, 10
    assert session.get.call_count == 3
    # The single-threaded gate is never hit concurrently.
    assert track["max"] == 1
    for i in range(50):
        assert results[i] == {"status": f"r::q{i}"}


@pytest.mark.asyncio
async def test_status_chunk_failure_isolated_to_that_chunk():
    """A failing chunk rejects only its own callers; other chunks still resolve."""

    def fail_on(payload):
        return any(str(v) == "q25" for v in payload.values())

    session = _make_status_session(fail_on=fail_on)
    client = GrentonApiClient(
        "http://fake-gate", session, status_batch_window=0.02, max_gets_per_request=20
    )

    results = await asyncio.gather(
        *[client.get_status({"status": f"q{i}"}) for i in range(30)],
        return_exceptions=True,
    )

    assert session.get.call_count == 2  # chunk 0-19 and chunk 20-29
    for i in range(20):  # first chunk succeeded
        assert results[i] == {"status": f"r::q{i}"}
    for i in range(20, 30):  # second chunk (contains q25) failed
        assert isinstance(results[i], aiohttp.ClientError)


@pytest.mark.asyncio
async def test_get_status_passes_timeout():
    """Status requests should carry an explicit timeout."""
    session = _make_status_session()
    client = GrentonApiClient("http://fake-gate", session, status_batch_window=0.0)

    await client.get_status({"status": "x"})

    assert session.get.call_args[1].get("timeout") is not None
