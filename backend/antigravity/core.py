import re
import json
import urllib.parse
from typing import Callable, Dict, List, Tuple, Any, Union

class Request:
    """
    Represents an incoming HTTP request in the Antigravity framework.
    """
    def __init__(self, environ: dict):
        self.environ = environ
        self.path = environ.get('PATH_INFO', '/')
        self.method = environ.get('REQUEST_METHOD', 'GET').upper()
        self.query_string = environ.get('QUERY_STRING', '')
        
        # Parse query parameters
        self.query_params = urllib.parse.parse_qs(self.query_string)
        # Simplify dict from list of values to single value if only one exists
        self.query_params = {k: v[0] if len(v) == 1 else v for k, v in self.query_params.items()}
        
        # Parse HTTP headers
        self.headers = {}
        for k, v in environ.items():
            if k.startswith('HTTP_'):
                header_name = k[5:].replace('_', '-').lower()
                self.headers[header_name] = v
            elif k in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
                header_name = k.replace('_', '-').lower()
                self.headers[header_name] = v

        # Read the raw request body
        try:
            content_length = int(environ.get('CONTENT_LENGTH', 0))
        except ValueError:
            content_length = 0
        
        self.body = environ['wsgi.input'].read(content_length) if content_length > 0 else b''
        self._json_cache = None

    def json(self) -> Dict[str, Any]:
        """
        Parses request body as JSON and caches it.
        """
        if self._json_cache is not None:
            return self._json_cache
        if not self.body:
            return {}
        try:
            self._json_cache = json.loads(self.body.decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            self._json_cache = {}
        return self._json_cache


class Response:
    """
    Represents an outgoing HTTP response in the Antigravity framework.
    """
    def __init__(self, body: Union[str, bytes, dict, list] = None, status_code: int = 200, headers: Dict[str, str] = None):
        self.status_code = status_code
        self.headers = headers if headers is not None else {}
        
        # Default Content-Type to JSON if dictionary or list is passed
        if isinstance(body, (dict, list)):
            self.body = json.dumps(body, ensure_ascii=False).encode('utf-8')
            if 'content-type' not in [k.lower() for k in self.headers.keys()]:
                self.headers['Content-Type'] = 'application/json; charset=utf-8'
        elif isinstance(body, str):
            self.body = body.encode('utf-8')
            if 'content-type' not in [k.lower() for k in self.headers.keys()]:
                self.headers['Content-Type'] = 'text/plain; charset=utf-8'
        elif isinstance(body, bytes):
            self.body = body
            if 'content-type' not in [k.lower() for k in self.headers.keys()]:
                self.headers['Content-Type'] = 'application/octet-stream'
        else:
            self.body = b''
            
        if 'content-length' not in [k.lower() for k in self.headers.keys()]:
            self.headers['Content-Length'] = str(len(self.body))


class Antigravity:
    """
    Antigravity Web Framework Application core.
    """
    def __init__(self):
        # A list of tuples: (HTTP_METHOD, REGEX_PATTERN, HANDLER_FUNC)
        self.routes: List[Tuple[str, re.Pattern, Callable]] = []

    def route(self, path: str, methods: List[str] = None):
        """
        Decorator to register a route pattern.
        Converts path parameters (e.g. {id}) into regex groups.
        """
        if methods is None:
            methods = ['GET']
            
        def decorator(func: Callable):
            # Replace path parameters like {id} with named regex groups (?P<id>[^/]+)
            pattern_str = re.sub(r'{([^}]+)}', r'(?P<\1>[^/]+)', path)
            # Match the entire path string
            pattern_regex = re.compile(f"^{pattern_str}$")
            
            for m in methods:
                self.routes.append((m.upper(), pattern_regex, func))
            return func
        return decorator

    def get(self, path: str):
        return self.route(path, ['GET'])

    def post(self, path: str):
        return self.route(path, ['POST'])

    def put(self, path: str):
        return self.route(path, ['PUT'])

    def delete(self, path: str):
        return self.route(path, ['DELETE'])

    def __call__(self, environ: dict, start_response: Callable):
        """
        WSGI application call interface.
        """
        request = Request(environ)
        
        # Setup CORS Headers to allow direct connections from any origin
        cors_headers = [
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With'),
        ]
        
        # Handle CORS preflight options request
        if request.method == 'OPTIONS':
            start_response('200 OK', cors_headers + [('Content-Length', '0')])
            return [b'']
            
        # Match routes
        for method, pattern, handler in self.routes:
            if method == request.method:
                match = pattern.match(request.path)
                if match:
                    kwargs = match.groupdict()
                    try:
                        # Call handler
                        resp = handler(request, **kwargs)
                        
                        # Process response format
                        if isinstance(resp, Response):
                            response = resp
                        elif isinstance(resp, tuple):
                            # Tuple options: (body, status_code) or (body, status_code, headers)
                            body = resp[0]
                            code = resp[1]
                            headers = resp[2] if len(resp) > 2 else None
                            response = Response(body, code, headers)
                        else:
                            response = Response(resp)
                            
                        status_text = self._get_status_text(response.status_code)
                        headers_list = list(response.headers.items())
                        
                        # Add CORS headers
                        headers_list.extend(cors_headers)
                        
                        start_response(status_text, headers_list)
                        return [response.body]
                        
                    except Exception as e:
                        import traceback
                        traceback.print_exc()
                        
                        err_body = {
                            "error": "Internal Server Error",
                            "message": str(e)
                        }
                        response = Response(err_body, 500)
                        headers_list = list(response.headers.items()) + cors_headers
                        start_response('500 Internal Server Error', headers_list)
                        return [response.body]
                        
        # Route not found
        err_body = {
            "error": "Not Found",
            "message": f"Route '{request.method} {request.path}' not defined in Antigravity"
        }
        response = Response(err_body, 404)
        headers_list = list(response.headers.items()) + cors_headers
        start_response('404 Not Found', headers_list)
        return [response.body]

    def _get_status_text(self, code: int) -> str:
        status_map = {
            200: '200 OK',
            201: '201 Created',
            204: '204 No Content',
            400: '400 Bad Request',
            401: '401 Unauthorized',
            403: '403 Forbidden',
            404: '404 Not Found',
            405: '405 Method Not Allowed',
            500: '500 Internal Server Error'
        }
        return status_map.get(code, f"{code} Custom Status")

    def run(self, host: str = '0.0.0.0', port: int = 8000):
        """
        Launches standard WSGI simple server with Threading enabled
        so background tasks don't block user requests.
        """
        from wsgiref.simple_server import make_server, WSGIServer
        from socketserver import ThreadingMixIn
        
        class ThreadingWSGIServer(ThreadingMixIn, WSGIServer):
            daemon_threads = True
            
        print(f"🌌 Antigravity Web Server lifting off at http://{host}:{port} ...")
        httpd = make_server(host, port, self, server_class=ThreadingWSGIServer)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🌌 Antigravity Web Server safely landed.")
