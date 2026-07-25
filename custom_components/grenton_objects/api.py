"""
==================================================
Grenton API Client - Centralized HTTP communication layer
with shared session and optional request batching.

Repository: https://github.com/jnalepka/grenton-objects-home-assistant
==================================================
"""

import asyncio
import logging
from typing import Any

import aiohttp

_LOGGER = logging.getLogger(__name__)

# Default: single event-loop tick (asyncio.sleep(0)). Catches concurrent calls
# from HA group actions with zero perceptible delay for single commands.
DEFAULT_BATCH_WINDOW = 0.0

# The Grenton HTTP Gate is a single-threaded embedded device that can drop or
# time out requests when hit concurrently (the same reason command batching
# exists). Serialize every request to a given gate so bursts — e.g. all sensors
# polling at once right after a Home Assistant restart — queue instead of
# overwhelming it.
MAX_CONCURRENT_REQUESTS = 1

# Per-request timeout (seconds). Prevents a single stuck request from blocking
# the serialized queue indefinitely.
DEFAULT_REQUEST_TIMEOUT = 15.0

# Status reads are collected within this window and merged into as few HTTP
# requests as possible. A small non-zero window lets the restart burst — every
# entity syncing its state at once — coalesce into a handful of requests instead
# of firing one serialized request per entity. The added latency is imperceptible
# for a background state sync.
DEFAULT_STATUS_BATCH_WINDOW = 0.05

# Cap the number of get() calls merged into a single request. Each get() is a
# separate, blocking round-trip from the gate to a CLU, executed sequentially
# inside one listener invocation; packing too many into one request would block
# the single-threaded gate for seconds and risk a listener timeout. Chunking
# keeps each request short while still collapsing N entity reads into
# ~N/limit requests.
DEFAULT_MAX_GETS_PER_REQUEST = 20


class GrentonApiError(Exception):
    """Normalized exception for non-aiohttp errors surfaced by the API client."""


class GrentonApiClient:
    """Centralized HTTP client for communicating with the Grenton HTTP Gate.

    Features:
    - Shared aiohttp.ClientSession (connection reuse, keepalive)
    - Command batching: collects commands within a configurable time window
      and merges them into a single HTTP request.

    Batch window behavior:
    - 0 (default): waits one event-loop tick (asyncio.sleep(0)). Only truly
      concurrent calls (e.g. HA group "turn off all lights") get batched.
      Single commands fire instantly with no perceptible delay.
    - >0: waits the specified seconds, collecting staggered commands.

    ``batch_window`` is an internal tuning value, not a user-facing setting;
    it currently always uses the default. All entities sharing an endpoint
    share a single client instance, so their commands batch together and, via
    the request semaphore, every request to the gate is serialized.
    """

    def __init__(
        self,
        endpoint: str,
        session: aiohttp.ClientSession,
        batch_window: float = DEFAULT_BATCH_WINDOW,
        status_batch_window: float = DEFAULT_STATUS_BATCH_WINDOW,
        max_gets_per_request: int = DEFAULT_MAX_GETS_PER_REQUEST,
    ) -> None:
        self._endpoint = endpoint
        self._session = session
        self._batch_window = batch_window
        self._status_batch_window = status_batch_window
        self._max_gets_per_request = max(1, max_gets_per_request)

        # Command (write) batching state
        self._pending_commands: list[tuple[str, asyncio.Future]] = []
        self._batch_lock = asyncio.Lock()
        self._batch_task: asyncio.Task | None = None

        # Status (read) batching state — mirrors command batching, but issued as
        # GET and split into chunks so one request never blocks the gate too long.
        self._pending_status: list[tuple[str, asyncio.Future]] = []
        self._status_batch_lock = asyncio.Lock()
        self._status_batch_task: asyncio.Task | None = None

        # Serialize traffic to the (fragile, single-threaded) gate and bound
        # each request so a stuck one cannot block the queue forever.
        self._request_semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
        self._timeout = aiohttp.ClientTimeout(total=DEFAULT_REQUEST_TIMEOUT)

    @property
    def endpoint(self) -> str:
        return self._endpoint

    @property
    def batch_window(self) -> float:
        return self._batch_window

    def _get_session(self) -> aiohttp.ClientSession:
        return self._session

    # ─── Public API ───────────────────────────────────────────────────────

    async def send_command(self, command: dict[str, str]) -> dict[str, Any]:
        """Send a command (POST) to the Grenton Gate.

        The command is queued and merged with other commands arriving within
        the batch window. With the default window of 0 (one event-loop tick),
        only truly concurrent calls (e.g. HA group actions) are batched —
        single commands fire with no perceptible delay.
        """
        futures: list[asyncio.Future] = []
        async with self._batch_lock:
            loop = asyncio.get_running_loop()
            for key, value in command.items():
                future: asyncio.Future = loop.create_future()
                self._pending_commands.append((value, future))
                futures.append(future)

            if self._batch_task is None or self._batch_task.done():
                self._batch_task = asyncio.create_task(self._flush_batch())

        # Wait for the batch to be sent and return the merged response
        results = await asyncio.gather(*futures)
        # Reconstruct a response dict matching original keys
        response = {}
        for key, result in zip(command.keys(), results):
            response[key] = result
        return response

    async def get_status(self, query: dict[str, str]) -> dict[str, Any]:
        """Send a status query (GET) to the Grenton Gate.

        Reads are collected within a short window and merged into as few HTTP
        requests as possible, then split into chunks of at most
        ``max_gets_per_request`` get() calls. This keeps the restart burst —
        every entity syncing its state at once — from hitting the single-threaded
        gate with one serialized request per entity, while bounding how long any
        one request can block the gate.

        The caller's original keys are preserved: the response dict is rebuilt
        with the same keys the query used (e.g. ``status``, ``status_2``), so
        entity code stays unchanged even though the wire payload renumbers keys.
        """
        futures: list[asyncio.Future] = []
        async with self._status_batch_lock:
            loop = asyncio.get_running_loop()
            for value in query.values():
                future: asyncio.Future = loop.create_future()
                self._pending_status.append((value, future))
                futures.append(future)

            if self._status_batch_task is None or self._status_batch_task.done():
                self._status_batch_task = asyncio.create_task(self._flush_status_batch())

        results = await asyncio.gather(*futures)
        return dict(zip(query.keys(), results))

    def close(self) -> None:
        """Cancel any in-flight batch task and fail pending futures.

        Called during unload to ensure no background work outlives the entry.
        """
        if self._batch_task and not self._batch_task.done():
            self._batch_task.cancel()
        if self._status_batch_task and not self._status_batch_task.done():
            self._status_batch_task.cancel()
        for _, future in self._pending_commands:
            if not future.done():
                future.cancel()
        for _, future in self._pending_status:
            if not future.done():
                future.cancel()
        self._pending_commands.clear()
        self._pending_status.clear()

    # ─── Internal ─────────────────────────────────────────────────────────

    async def _flush_batch(self) -> None:
        """Wait for the batch window, then send all pending commands in one request.

        Drains in a loop to avoid a race where commands enqueued after the
        copy+clear but before the task completes would never be flushed.
        Re-applies the batch window before each cycle so late arrivals coalesce.
        """
        while True:
            await asyncio.sleep(self._batch_window)

            async with self._batch_lock:
                pending = self._pending_commands[:]
                self._pending_commands.clear()

            if not pending:
                # Re-check under lock to avoid lost-wakeup: a command may have
                # been enqueued after clear but before we reach this point, and
                # the enqueuer saw _batch_task as still running.
                async with self._batch_lock:
                    if self._pending_commands:
                        continue
                return

            # Build merged payload with numbered command keys
            payload: dict[str, str] = {}
            for i, (cmd_value, _) in enumerate(pending):
                key = "command" if i == 0 else f"command_{i + 1}"
                payload[key] = cmd_value

            # Send the single merged request
            try:
                session = self._get_session()
                async with self._request_semaphore:
                    async with session.post(self._endpoint, json=payload, timeout=self._timeout) as response:
                        response.raise_for_status()
                        data = await response.json()

                # Resolve all futures - the Grenton script returns results keyed
                # the same way we sent them
                for i, (_, future) in enumerate(pending):
                    key = "command" if i == 0 else f"command_{i + 1}"
                    result = data.get(key, data.get("g_status", "OK"))
                    if not future.done():
                        future.set_result(result)

            except asyncio.CancelledError:
                for _, future in pending:
                    if not future.done():
                        future.cancel()
                raise
            except Exception as ex:
                # On failure, reject all futures with a normalized exception
                wrapped = GrentonApiError(str(ex)) if not isinstance(ex, aiohttp.ClientError) else ex
                for _, future in pending:
                    if not future.done():
                        future.set_exception(wrapped)

    async def _flush_status_batch(self) -> None:
        """Wait for the batch window, then send all pending reads, chunked.

        Collects every read queued within the window and splits it into chunks
        of at most ``max_gets_per_request`` get() calls. Chunks are sent one at a
        time (the request semaphore serializes them against each other and against
        writes), so the single-threaded gate handles one bounded request at a
        time and a pending user command can slip in between chunks. Drains in a
        loop so reads enqueued mid-flush are picked up on the next cycle.
        """
        while True:
            await asyncio.sleep(self._status_batch_window)

            async with self._status_batch_lock:
                pending = self._pending_status[:]
                self._pending_status.clear()

            if not pending:
                async with self._status_batch_lock:
                    if self._pending_status:
                        continue
                return

            for start in range(0, len(pending), self._max_gets_per_request):
                chunk = pending[start:start + self._max_gets_per_request]

                # Renumber keys per chunk. The first key must be literally
                # "status" so the gate listener's `reqJson.command or
                # reqJson.status` guard accepts the request.
                payload: dict[str, str] = {}
                for i, (query_value, _) in enumerate(chunk):
                    key = "status" if i == 0 else f"status_{i + 1}"
                    payload[key] = query_value

                try:
                    session = self._get_session()
                    async with self._request_semaphore:
                        async with session.get(self._endpoint, json=payload, timeout=self._timeout) as response:
                            response.raise_for_status()
                            data = await response.json()

                    for i, (_, future) in enumerate(chunk):
                        key = "status" if i == 0 else f"status_{i + 1}"
                        if not future.done():
                            future.set_result(data.get(key))

                except asyncio.CancelledError:
                    for _, future in chunk:
                        if not future.done():
                            future.cancel()
                    raise
                except Exception as ex:
                    # Reject only this chunk's futures; other chunks are unaffected.
                    wrapped = GrentonApiError(str(ex)) if not isinstance(ex, aiohttp.ClientError) else ex
                    for _, future in chunk:
                        if not future.done():
                            future.set_exception(wrapped)


def get_api_client(hass, endpoint: str, batch_window: float = DEFAULT_BATCH_WINDOW) -> GrentonApiClient:
    """Get or create a shared GrentonApiClient for the given endpoint.

    If a client already exists for this endpoint, returns the existing one.
    Uses Home Assistant's shared aiohttp session for proper connection management.
    """
    from .const import DOMAIN
    from homeassistant.helpers.aiohttp_client import async_get_clientsession

    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {"entities": {}, "clients": {}}

    if "clients" not in hass.data[DOMAIN]:
        hass.data[DOMAIN]["clients"] = {}

    clients = hass.data[DOMAIN]["clients"]
    if endpoint not in clients:
        session = async_get_clientsession(hass)
        clients[endpoint] = GrentonApiClient(endpoint, session, batch_window=batch_window)

    return clients[endpoint]
