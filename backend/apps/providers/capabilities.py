"""
Provider Capabilities Model.
Defines explicit capabilities supported across AI providers in Vizzy.
"""

from enum import Enum
from typing import Set


class ProviderCapability(str, Enum):
    TEXT_GENERATION = 'text_generation'
    IMAGE_GENERATION = 'image_generation'
    REFERENCE_IMAGE = 'reference_image'
    IMAGE_TO_IMAGE = 'image_to_image'
    ASPECT_RATIO = 'aspect_ratio'
    RESOLUTION_CONTROL = 'resolution_control'


class CapabilityChecker:
    """Utility to query and validate provider capabilities."""

    @staticmethod
    def supports(capabilities: Set[ProviderCapability], capability: ProviderCapability) -> bool:
        return capability in capabilities

    @staticmethod
    def validate_capability(capabilities: Set[ProviderCapability], capability: ProviderCapability):
        if not CapabilityChecker.supports(capabilities, capability):
            raise UnsupportedCapabilityError(f"Capability '{capability.value}' is not supported by this provider.")


class UnsupportedCapabilityError(Exception):
    """Raised when an unverified or unsupported capability is requested."""
    pass
