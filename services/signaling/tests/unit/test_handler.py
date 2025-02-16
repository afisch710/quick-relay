import json
import unittest
from unittest.mock import MagicMock, patch
from signaling.handler import create_handler, generate_short_code

class DummyContext:
    def __init__(self):
        self.function_name = "dummy"
        self.memory_limit_in_mb = 128
        self.invoked_function_arn = "arn:aws:lambda:dummy:123:function:dummy"
        self.aws_request_id = "dummy-request-id"

class TestLambdaHandler(unittest.TestCase):
    def setUp(self):
        self.context = DummyContext()
        self.mock_table = MagicMock()
        self.handler = create_handler(self.mock_table)

    @patch("boto3.client")
    def test_connect_create_session(self, mock_boto_client):
        # Patch the apigatewaymanagementapi client
        mock_api = MagicMock()
        mock_api.post_to_connection.return_value = {}
        mock_boto_client.return_value = mock_api
        
        self.mock_table.put_item.return_value = {}
        event = {
            "requestContext": {
                "routeKey": "$connect",
                "connectionId": "conn1",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "queryStringParameters": None,
            "body": None
        }
        response = self.handler(event, self.context)
        self.assertEqual(response["statusCode"], 200)
        self.mock_table.put_item.assert_called_once()

    @patch("boto3.client")
    def test_connect_join_session_not_found(self, mock_boto_client):
        mock_api = MagicMock()
        mock_api.post_to_connection.return_value = {}
        mock_boto_client.return_value = mock_api
        
        self.mock_table.get_item.return_value = {}
        event = {
            "requestContext": {
                "routeKey": "$connect",
                "connectionId": "conn3",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "queryStringParameters": {"sessionCode": "000000"},
            "body": None
        }
        response = self.handler(event, self.context)
        self.assertEqual(response["statusCode"], 404)

    @patch("boto3.client")
    def test_connect_join_session_success(self, mock_boto_client):
        mock_api = MagicMock()
        mock_api.post_to_connection.return_value = {}
        mock_boto_client.return_value = mock_api
        
        session_code = "123456"
        self.mock_table.get_item.return_value = {
            "Item": {
                "SessionCode": {"S": session_code},
                "CreatedAt": {"S": "2024-04-01T12:00:00"}
            }
        }
        event = {
            "requestContext": {
                "routeKey": "$connect",
                "connectionId": "conn2",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "queryStringParameters": {"sessionCode": session_code},
            "body": None
        }
        response = self.handler(event, self.context)
        self.assertEqual(response["statusCode"], 200)
        self.mock_table.get_item.assert_called_once_with(Key={"SessionCode": session_code})

    @patch("boto3.client")
    def test_disconnect(self, mock_boto_client):
        mock_boto_client.return_value = MagicMock()
        event = {
            "requestContext": {
                "routeKey": "$disconnect",
                "connectionId": "conn1",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": None
        }
        response = self.handler(event, self.context)
        self.assertEqual(response["statusCode"], 200)

    def test_invalid_route(self):
        event = {
            "requestContext": {
                "routeKey": "unknown",
                "connectionId": "conn4",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": None
        }
        response = self.handler(event, self.context)
        self.assertEqual(response["statusCode"], 400)

    def test_generate_short_code(self):
        code = generate_short_code()
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())

if __name__ == '__main__':
    unittest.main()