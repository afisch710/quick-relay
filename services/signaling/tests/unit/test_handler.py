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
        # Create a handler instance using dependency injection.
        self.handler = create_handler(self.mock_table)

    @patch("boto3.client")
    def test_connect_route(self, mock_boto_client):
        # Test the $connect route, which should simply return 200.
        mock_api = MagicMock()
        mock_api.post_to_connection.return_value = {}
        mock_boto_client.return_value = mock_api

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
        # $connect does not trigger any table operation.
        self.mock_table.put_item.assert_not_called()
        self.mock_table.get_item.assert_not_called()

    @patch("boto3.client")
    def test_init_create_session(self, mock_boto_client):
        # Test the "init" route without a sessionCode in the body, triggering session creation.
        mock_api = MagicMock()
        mock_api.post_to_connection.return_value = {}
        mock_boto_client.return_value = mock_api
        
        # Simulate that table.put_item succeeds.
        self.mock_table.put_item.return_value = {}
        # Create an event on the "init" route with no sessionCode.
        event = {
            "requestContext": {
                "routeKey": "init",
                "connectionId": "conn2",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": json.dumps({"action": "init"})
        }
        response = self.handler(event, self.context)
        self.assertEqual(response["statusCode"], 200)
        # Verify that put_item was called for session creation.
        self.mock_table.put_item.assert_called_once()

    @patch("boto3.client")
    def test_init_join_session_success(self, mock_boto_client):
        # Test the "init" route with a sessionCode in the body, simulating joining an existing session.
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
                "routeKey": "init",
                "connectionId": "conn3",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": json.dumps({"action": "init", "sessionCode": session_code})
        }
        response = self.handler(event, self.context)
        self.assertEqual(response["statusCode"], 200)
        self.mock_table.get_item.assert_called_once_with(Key={"SessionCode": session_code})

    @patch("boto3.client")
    def test_init_join_session_not_found(self, mock_boto_client):
        # Test the "init" route with a sessionCode that does not exist.
        mock_api = MagicMock()
        mock_api.post_to_connection.return_value = {}
        mock_boto_client.return_value = mock_api
        
        self.mock_table.get_item.return_value = {}
        event = {
            "requestContext": {
                "routeKey": "init",
                "connectionId": "conn4",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": json.dumps({"action": "init", "sessionCode": "000000"})
        }
        response = self.handler(event, self.context)
        self.assertEqual(response["statusCode"], 404)

    def test_invalid_route(self):
        # Test an event with an unknown route.
        event = {
            "requestContext": {
                "routeKey": "unknown",
                "connectionId": "conn5",
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