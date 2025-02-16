import json
import os
import unittest
from datetime import datetime, timezone

# Fake DynamoDB implementation.
class FakeDynamoDBTable:
    def __init__(self):
        self.store = {}

    def put_item(self, Item):
        # Wrap each value as DynamoDB low-level format (e.g., {"S": "value"})
        wrapped = {}
        for key, value in Item.items():
            wrapped[key] = {"S": str(value)}
        session_code = wrapped.get("SessionCode", {}).get("S")
        if not session_code:
            raise ValueError("Item must have a 'SessionCode' key")
        self.store[session_code] = wrapped
        return {}

    def get_item(self, Key):
        session_code = Key.get("SessionCode")
        if session_code in self.store:
            return {"Item": self.store[session_code]}
        return {}

# A fake API Gateway Management API client for testing.
class FakeAPIGatewayClient:
    def post_to_connection(self, ConnectionId, Data):
        # Simply log the call (or do nothing) for tests.
        print(f"Fake post_to_connection: ConnectionId={ConnectionId}, Data={Data}")
        return {}

# Patch boto3.client to return our fake API Gateway client when requested.
def fake_boto_client(service, endpoint_url=None):
    if service == "apigatewaymanagementapi":
        return FakeAPIGatewayClient()
    # For other services, call the original boto3.client.
    import boto3
    return boto3.client(service, endpoint_url=endpoint_url)

# Import the dependency-injection factory from our handler.
from signaling.handler import create_handler, generate_short_code

class TestWebsocketHandlerWithFakeDynamoDB(unittest.TestCase):
    def setUp(self):
        # Set environment variable for TABLE_NAME.
        os.environ["TABLE_NAME"] = "TestSignalingSessions"
        # Instantiate our fake DynamoDB table.
        self.fake_table = FakeDynamoDBTable()
        # Create a handler instance using dependency injection.
        self.handler = create_handler(self.fake_table)
        # Patch boto3.client so that the signaling handler uses our fake API Gateway client.
        self.original_boto_client = None
        import boto3
        self.original_boto_client = boto3.client
        boto3.client = fake_boto_client

    def tearDown(self):
        # Restore the original boto3.client.
        import boto3
        boto3.client = self.original_boto_client
        del os.environ["TABLE_NAME"]

    def test_connect_create_session(self):
        # Simulate a $connect event without a sessionCode (should create a session).
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
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        # Verify that a session was created in the fake table.
        self.assertEqual(len(self.fake_table.store), 1)

    def test_connect_join_session_success(self):
        # Pre-populate the fake table with a session.
        session_code = "123456"
        self.fake_table.put_item({
            "SessionCode": session_code,
            "CreatedAt": datetime.now(timezone.utc).isoformat(),
            "ConnectionId": "existingConn"
        })
        # Simulate a $connect event with a sessionCode to join.
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
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 200)

    def test_connect_join_session_not_found(self):
        # Simulate a $connect event with a non-existent sessionCode.
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
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 404)

if __name__ == '__main__':
    unittest.main()