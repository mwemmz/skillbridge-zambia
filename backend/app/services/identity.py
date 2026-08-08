"""Identity verification as a swappable service.

The rest of the app only ever talks to the `IdentityVerifier` interface, so the
government-backed Zambia NRC implementation can be replaced (or pointed at a real
e-Gov API) without touching any business logic.
"""

from abc import ABC, abstractmethod


class IdentityVerifier(ABC):
    """Abstract contract for verifying a worker's government-issued identity."""

    @abstractmethod
    def verify(self, worker) -> dict:
        """Return {"verified": bool, "message": str, "external_ref": str | None}."""


class ZambiaNRCVerifier(IdentityVerifier):
    """Stub for the Zambia NRC (national registration card) service.

    In production this would call the e-Gov / ZAMTEL NRC verification endpoint
    with the worker's NRC number. For the demo we treat a worker with a phone
    number on file as having a matched NRC record.
    """

    def verify(self, worker) -> dict:
        has_record = bool(worker.user and worker.user.phone)
        return {
            "verified": has_record,
            "message": "NRC record matched" if has_record else "NRC record not found",
            "external_ref": f"nrc-{worker.id}" if has_record else None,
        }


class NullVerifier(IdentityVerifier):
    """Fallback when no identity provider is configured (never verifies)."""

    def verify(self, worker) -> dict:
        return {
            "verified": False,
            "message": "Identity service not configured",
            "external_ref": None,
        }


def get_identity_verifier() -> IdentityVerifier:
    """Factory - swap the concrete verifier here (env-driven in production)."""
    return ZambiaNRCVerifier()
