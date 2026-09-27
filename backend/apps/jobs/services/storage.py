"""
Cloudinary Storage Service for Vizzy.

Replaces legacy AWS S3/boto3 with Cloudinary free-tier managed storage.
Uploads image bytes / file-like objects / base64 payloads to Cloudinary
and returns the resulting HTTPS secure_url.
"""

import io
import logging
import os
from typing import Optional, Union

import cloudinary
import cloudinary.uploader
from django.conf import settings

logger = logging.getLogger(__name__)


def configure_cloudinary() -> None:
    """Configures Cloudinary credentials from Django settings or environment variables."""
    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', '') or os.environ.get('CLOUDINARY_CLOUD_NAME', '')
    api_key = getattr(settings, 'CLOUDINARY_API_KEY', '') or os.environ.get('CLOUDINARY_API_KEY', '')
    api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', '') or os.environ.get('CLOUDINARY_API_SECRET', '')

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


def upload_image(
    file_data: Union[bytes, io.BytesIO, str],
    public_id: Optional[str] = None,
    folder: str = 'vizzy/panels',
    tags: Optional[list] = None,
    overwrite: bool = True,
) -> str:
    """
    Upload image bytes or file stream to Cloudinary via cloudinary.uploader.upload().

    Args:
        file_data: Raw image bytes, BytesIO stream, file path, or data URI.
        public_id: Optional custom public identifier for the asset.
        folder: Cloudinary folder path (defaults to 'vizzy/panels').
        tags: Optional list of tags for metadata and organization.
        overwrite: Whether to overwrite existing asset with the same public_id.

    Returns:
        The resulting HTTPS secure_url string.

    Raises:
        RuntimeError: If the upload fails or no secure_url is returned.
    """
    configure_cloudinary()

    upload_params = {
        'folder': folder,
        'resource_type': 'image',
        'overwrite': overwrite,
        'unique_filename': True if not public_id else False,
    }

    if public_id:
        upload_params['public_id'] = public_id

    if tags:
        upload_params['tags'] = tags

    # If bytes passed directly, wrap in BytesIO if needed by SDK
    payload = file_data
    if isinstance(file_data, bytes):
        payload = io.BytesIO(file_data)

    try:
        response = cloudinary.uploader.upload(payload, **upload_params)
        secure_url = response.get('secure_url')
        if not secure_url:
            raise RuntimeError(f"Cloudinary upload succeeded but no secure_url returned: {response}")
        return secure_url
    except Exception as exc:
        logger.error(f"Failed to upload image to Cloudinary: {exc}", exc_info=True)
        raise RuntimeError(f"Cloudinary upload failed: {exc}") from exc
