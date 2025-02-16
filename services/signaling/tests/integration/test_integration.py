import json
import os
import unittest
from datetime import datetime, timezone, timedelta

# Fake DynamoDB implementation.
class FakeDynamoDBTable:
    def __init__(self):
        self.store = {}

    def put_item(self, Item):
        session_code = Item.get("SessionCode")
        if not session_code:
            raise ValueError("Item must have a 'SessionCode' key")
        self.store[session_code] = Item
        return {}

    def get_item(self, Key):
        session_code = Key.get("SessionCode")
        if session_code in self.store:
            return {"Item": self.store[session_code]}
        return {}

    def update_item(self, Key, UpdateExpression, ExpressionAttributeValues):
        session_code = Key.get("SessionCode")
        if session_code not in self.store:
            raise Exception("Item not found")
        item = self.store[session_code]
        current_list = item.get("ConnectionIds", ExpressionAttributeValues.get(":empty"))
        new_list = current_list + ExpressionAttributeValues.get(":conn")
        item["ConnectionIds"] = new_list
        self.store[session_code] = item
        return {}

# Fake API Gateway Management API client for testing.
class FakeAPIGatewayClient:
    def __init__(self):
        self.messages = {}

    def post_to_connection(self, ConnectionId, Data):
        self.messages[ConnectionId] = Data
        return {}

# Patch boto3.client to return our fake API client.
def fake_boto_client(service, endpoint_url=None):
    if service == "apigatewaymanagementapi":
        return FakeAPIGatewayClient()
    import boto3
    return boto3.client(service, endpoint_url=endpoint_url)

# Import the dependency-injection factory from our handler.
from signaling.handler import create_handler, generate_short_code

class TestWebsocketHandlerWithFakeDynamoDB(unittest.TestCase):
    def setUp(self):
        os.environ["TABLE_NAME"] = "SignalingSessions"
        self.fake_table = FakeDynamoDBTable()
        self.handler = create_handler(self.fake_table)
        import boto3
        self.original_boto_client = boto3.client
        self.fake_api_client = FakeAPIGatewayClient()
        def always_return_fake(service, endpoint_url=None):
            if service == "apigatewaymanagementapi":
                return self.fake_api_client
            return self.original_boto_client(service, endpoint_url=endpoint_url)
        boto3.client = always_return_fake

        # Pre-populate the fake table with a session that is full (for join full tests)
        session_code_full = "123456"
        session_record_full = {
            "SessionCode": session_code_full,
            "CreatedAt": datetime.now(timezone.utc).isoformat(),
            "ConnectionIds": ["conn1", "conn2"],
            "ExpiresAt": str(int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()))
        }
        self.fake_table.put_item(Item=session_record_full)

    def tearDown(self):
        import boto3
        boto3.client = self.original_boto_client
        del os.environ["TABLE_NAME"]

    def test_connect_route(self):
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

    def test_disconnect_route(self):
        event = {
            "requestContext": {
                "routeKey": "$disconnect",
                "connectionId": "conn1",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": None
        }
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 200)

    def test_init_create_session(self):
        event = {
            "requestContext": {
                "routeKey": "init",
                "connectionId": "conn_new",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": json.dumps({"action": "init"})
        }
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        # Now, the fake table should contain the pre-populated session plus the new one.
        self.assertEqual(len(self.fake_table.store), 2)

    def test_init_join_session_success(self):
        # For a successful join, create a session with only one connection.
        session_code = "654321"
        session_record = {
            "SessionCode": session_code,
            "CreatedAt": datetime.now(timezone.utc).isoformat(),
            "ConnectionIds": ["connA"],
            "ExpiresAt": str(int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()))
        }
        self.fake_table.put_item(Item=session_record)
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
        session = self.fake_table.get_item(Key={"SessionCode": session_code})["Item"]
        self.assertIn("conn3", session.get("ConnectionIds", []))

    def test_init_join_session_not_found(self):
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

    def test_init_join_session_full(self):
        session_code = "123456"  # Pre-populated session with ["conn1", "conn2"]
        event = {
            "requestContext": {
                "routeKey": "init",
                "connectionId": "conn3",  # Attempting to join as third connection.
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": json.dumps({"action": "init", "sessionCode": session_code})
        }
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 403)
        posted = json.loads(self.fake_api_client.messages.get("conn3", "{}"))
        self.assertEqual(posted.get("error"), "Session is full")

    def test_signal_route(self):
        # Simulate a "signal" event from connection "conn1" relaying a signaling message.
        session_code = "123456"
        signal_payload = {
            "action": "signal",
            "sessionCode": session_code,
            "type": "offer",
            "sdp": "<SDP offer data>"
        }
        event = {
            "requestContext": {
                "routeKey": "signal",
                "connectionId": "conn1",
                "domainName": "example.execute-api.us-east-1.amazonaws.com",
                "stage": "prod"
            },
            "body": json.dumps(signal_payload)
        }
        response = self.handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        # The pre-populated session "123456" has connections ["conn1", "conn2"].
        # We expect the signal to be relayed only to "conn2".
        self.assertIn("conn2", self.fake_api_client.messages)
        relayed = json.loads(self.fake_api_client.messages["conn2"])
        self.assertEqual(relayed.get("action"), "signal")
        self.assertEqual(relayed.get("type"), "offer")
        self.assertEqual(relayed.get("sdp"), "<SDP offer data>")
        self.assertNotIn("conn1", self.fake_api_client.messages)

if __name__ == '__main__':
    unittest.main()