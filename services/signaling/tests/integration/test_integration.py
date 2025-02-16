import json
import os
import unittest
from datetime import datetime, timezone, timedelta

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
        # For testing, simply print out the call.
        print(f"Fake post_to_connection: ConnectionId={ConnectionId}, Data={Data}")
        return {}

# Patch boto3.client to return our fake API Gateway client when requested.
def fake_boto_client(service, endpoint_url=None):
    if service == "apigatewaymanagementapi":
        return FakeAPIGatewayClient()
    # Otherwise, return the real boto3 client.
    import boto3
    return boto3.client(service, endpoint_url=endpoint_url)

# Import the dependency-injection factory from our handler.
from signaling.handler import create_handler, generate_short_code

class TestWebsocketHandlerWithFakeDynamoDB(unittest.TestCase):
    def setUp(self):
        # Set environment variable for TABLE_NAME.
        os.environ["TABLE_NAME"] = "SignalingSessions"
        # Instantiate our fake DynamoDB table.
        self.fake_table = FakeDynamoDBTable()
        # Create a handler instance using dependency injection.
        self.handler = create_handler(self.fake_table)
        # Patch boto3.client globally to return our fake API Gateway client.
        self.original_boto_client = None
        import boto3
        self.original_boto_client = boto3.client
        boto3.client = fake_boto_client

    def tearDown(self):
        # Restore the original boto3.client.
        import boto3
        boto3.client = self.original_boto_client
        del os.environ["TABLE_NAME"]

    def test_connect_route(self):
        # Test the $connect route.
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
        # $connect simply returns 200.
        self.assertEqual(response["statusCode"], 200)

    def test_init_create_session(self):
        # Test the "init" route for session creation (no sessionCode provided).
        event = {
            "requestContext": {
                "routeKey": "init",
                "connectionId": "conn2",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": json.dumps({"action": "init"})  # No sessionCode field.
        }
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        # Verify that a session was created in our fake table.
        self.assertEqual(len(self.fake_table.store), 1)
        # Optionally, print out the stored session for debugging.
        print("Stored sessions:", self.fake_table.store)

    def test_init_join_session_success(self):
        # Pre-populate fake table with a session.
        session_code = "123456"
        now = datetime.now(timezone.utc)
        expires_at = int((now + timedelta(hours=1)).timestamp())
        self.fake_table.put_item({
            "SessionCode": session_code,
            "CreatedAt": now.isoformat(),
            "ConnectionId": "existingConn",
            "ExpiresAt": expires_at
        })
        # Test the "init" route with a sessionCode to join.
        event = {
            "requestContext": {
                "routeKey": "init",
                "connectionId": "conn3",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": json.dumps({"action": "init", "sessionCode": session_code})
        }
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 200)

    def test_init_join_session_not_found(self):
        # Test the "init" route with a sessionCode that does not exist.
        event = {
            "requestContext": {
                "routeKey": "init",
                "connectionId": "conn4",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": json.dumps({"action": "init", "sessionCode": "000000"})
        }
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 404)

if __name__ == '__main__':
    unittest.main()