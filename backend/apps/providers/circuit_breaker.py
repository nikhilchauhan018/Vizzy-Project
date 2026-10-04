"""
Circuit Breaker Pattern for AI Providers.
Protects upstream services and initiates failover when failure thresholds are breached.
"""

import time
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    CLOSED = 'closed'       # Healthy, calls permitted
    OPEN = 'open'           # Unhealthy, calls blocked / failover triggered
    HALF_OPEN = 'half_open' # Testing recovery with a single call


class CircuitBreaker:
    """
    In-memory circuit breaker per provider with configurable threshold and recovery timeout.
    """

    def __init__(self, failure_threshold: int = 3, recovery_timeout_seconds: float = 30.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_state_change = time.time()
        self.last_failure_time = 0.0

    def can_execute(self) -> bool:
        """Determines if a request can be dispatched to this provider."""
        now = time.time()
        if self.state == CircuitState.CLOSED:
            return True
        elif self.state == CircuitState.OPEN:
            if now - self.last_state_change >= self.recovery_timeout_seconds:
                logger.info("Circuit breaker transitioning to HALF_OPEN to test recovery.")
                self.state = CircuitState.HALF_OPEN
                self.last_state_change = now
                return True
            return False
        elif self.state == CircuitState.HALF_OPEN:
            return True
        return False

    def record_success(self):
        """Records a successful call and closes the circuit."""
        self.failure_count = 0
        if self.state != CircuitState.CLOSED:
            logger.info("Provider recovered successfully. Circuit CLOSED.")
            self.state = CircuitState.CLOSED
            self.last_state_change = time.time()

    def record_failure(self):
        """Records a failed call. Trips the circuit if threshold reached."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold or self.state == CircuitState.HALF_OPEN:
            logger.warning(
                f"Provider threshold reached ({self.failure_count}/{self.failure_threshold}). Circuit OPEN."
            )
            self.state = CircuitState.OPEN
            self.last_state_change = time.time()

    def reset(self):
        """Resets the circuit breaker state to closed."""
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        self.last_state_change = time.time()
