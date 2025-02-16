import json
import os
import boto3
import random
from datetime import datetime, timezone, timedelta
from boto3.dynamodb.types import TypeDeserializer
from botocore.exceptions import ClientError

deserializer = TypeDeserializer()

def deserialize_item(item):
    """Convert a low-level DynamoDB item to a regular Python dict."""
    return {k: deserializer.deserialize(v) for k, v in item.items()}

def create_handler(table):
    """
    Returns a Lambda handler that uses the provided DynamoDB table.
    Handles WebSocket events on:
      - $connect: Just returns 200 (optionally stores connection info).
      - "init": Handles session creation/join based on the payload.
      - $disconnect: Logs disconnect.
    """
    def handler(event, context):
        print("Received event:", json.dumps(event, indent=2))
        route_key = event.get("requestContext", {}).get("routeKey")
        connection_id = event.get("requestContext", {}).get("connectionId")
        
        # Set up API Gateway Management API for sending messages.
        domain_name = event["requestContext"]["domainName"]
        stage = event["requestContext"]["stage"]
        endpoint = f"https://{domain_name}/{stage}"
        api_gateway = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)
        
        if route_key == "$connect":
            # On $connect, do minimal work. Optionally store connection info.
            print(f"Connection {connection_id} established.")
            return {"statusCode": 200}
        
        elif route_key == "init":
            # This route handles session creation/joining.
            try:
                body = json.loads(event.get("body") or "{}")
            except Exception:
                return {"statusCode": 400, "body": "Invalid JSON in request body"}
            
            session_code = body.get("sessionCode")
            if session_code:
                # Join session flow.
                try:
                    result = table.get_item(Key={"SessionCode": session_code})
                    if "Item" not in result:
                        message = json.dumps({"error": "Session not found"})
                        api_gateway.post_to_connection(ConnectionId=connection_id, Data=message)
                        return {"statusCode": 404}
                    else:
                        message = json.dumps({"message": "Joined session", "sessionCode": session_code})
                        api_gateway.post_to_connection(ConnectionId=connection_id, Data=message)
                        return {"statusCode": 200}
                except Exception as e:
                    print("Error joining session:", str(e))
                    message = json.dumps({"error": "Error joining session"})
                    api_gateway.post_to_connection(ConnectionId=connection_id, Data=message)
                    return {"statusCode": 500}
            else:
                # Create session flow.
                new_session_code = generate_short_code()
                now = datetime.now(timezone.utc)
                expires_at = int((now + timedelta(hours=1)).timestamp())
                try:
                    table.put_item(Item={
                        "SessionCode": new_session_code,
                        "CreatedAt": now.isoformat(),
                        "ConnectionId": connection_id,
                        "ExpiresAt": expires_at
                    })
                    message = json.dumps({"message": "Session created", "sessionCode": new_session_code})
                    api_gateway.post_to_connection(ConnectionId=connection_id, Data=message)
                    return {"statusCode": 200}
                except Exception as e:
                    print("Error creating session:", str(e))
                    message = json.dumps({"error": "Error creating session"})
                    api_gateway.post_to_connection(ConnectionId=connection_id, Data=message)
                    return {"statusCode": 500}
        else:
            return {"statusCode": 400, "body": "Invalid route"}
    return handler

def generate_short_code():
    """Generate a random 6-digit code as a string."""
    return str(random.randint(100000, 999999))

# Default wiring: use the table specified by the environment variable TABLE_NAME.
_default_table = boto3.resource('dynamodb').Table(os.environ.get("TABLE_NAME", "SignalingSessions"))
table = _default_table
lambda_handler = create_handler(_default_table)