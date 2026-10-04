"""
Structured Provider Exceptions.
Ensures provider failures never leak raw tokens or internal secrets.
"""


class ProviderError(Exception):
    """Base exception for all AI provider operations."""
    def __init__(self, message: str, provider_name: str, status_code: int = 500, details: dict = None):
        super().__init__(message)
        self.message = message
        self.provider_name = provider_name
        self.status_code = status_code
        self.details = details or {}


class ProviderConfigurationError(ProviderError):
    """Raised when provider configuration or credentials are missing or invalid."""
    pass


class ProviderAuthenticationError(ProviderError):
    """Raised when provider authentication fails (e.g. invalid user token)."""
    pass


class ProviderRateLimitError(ProviderError):
    """Raised when rate limit or quota budget is exhausted."""
    pass


class ProviderUnavailableError(ProviderError):
    """Raised when the provider is down, unreachable, or returns a 5xx error."""
    pass


class ProviderCircuitOpenError(ProviderError):
    """Raised when calls to the provider are paused due to an open circuit breaker."""
    pass
