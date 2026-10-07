import os


class InstanceIdentifierMiddleware:
    """
    Appends the X-Served-By response header with the current server instance identifier
    (from the INSTANCE_ID environment variable), supporting horizontal scaling observability.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        instance_id = os.environ.get('INSTANCE_ID', 'vizzy-app')
        response['X-Served-By'] = instance_id
        return response
