import json
import os
import boto3
import random
from datetime import datetime, timezone
from boto3.dynamodb.types import TypeDeserializer

deserializer = TypeDeserializer()

def deserialize_item(item):
    """Convert a low-level DynamoDB item to a regular Python dict."""
    return {k: deserializer.deserialize(v) for k, v in item.items()}

def create_handler(table):
    """
    Returns a Lambda handler that uses the provided DynamoDB table.
    This handler is intended for WebSocket API events:
      - $connect: If query string 'sessionCode' is present, join that session.
                  Otherwise, create a new session.
      - $disconnect: Perform cleanup (e.g., remove connection from session).
    """
    def handler(event, context):
        print("Received event:", json.dumps(event, indent=2))
        route_key = event.get("requestContext", {}).get("routeKey")
        connection_id = event.get("requestContext", {}).get("connectionId")
        
        # Set up API Gateway Management API to post messages back to the client.
        domain_name = event["requestContext"]["domainName"]
        stage = event["requestContext"]["stage"]
        endpoint = f"https://{domain_name}/{stage}"
        api_gateway = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)
        
        if route_key == "$connect":
            query_params = event.get("queryStringParameters") or {}
            session_code = query_params.get("sessionCode")
            if session_code:
                # Join session flow.
                try:
                    result = table.get_item(Key={"SessionCode": session_code})
                    if "Item" not in result:
                        message = json.dumps({"error": "Session not found"})
                        api_gateway.post_to_connection(ConnectionId=connection_id, Data=message)
                        return {"statusCode": 404}
                    else:
                        # Optionally, update the session with the new connection_id.
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
                now = datetime.now(timezone.utc).isoformat()
                try:
                    table.put_item(Item={
                        "SessionCode": new_session_code,
                        "CreatedAt": now,
                        "ConnectionId": connection_id
                    })
                    message = json.dumps({"message": "Session created", "sessionCode": new_session_code})
                    api_gateway.post_to_connection(ConnectionId=connection_id, Data=message)
                    return {"statusCode": 200}
                except Exception as e:
                    print("Error creating session:", str(e))
                    message = json.dumps({"error": "Error creating session"})
                    api_gateway.post_to_connection(ConnectionId=connection_id, Data=message)
                    return {"statusCode": 500}
        elif route_key == "$disconnect":
            # Handle disconnection; for now, just log the disconnection.
            print(f"Connection {connection_id} disconnected.")
            return {"statusCode": 200}
        else:
            return {"statusCode": 400, "body": "Invalid route"}
    return handler

def generate_short_code():
    """Generate a random 6-digit code as a string."""
    return str(random.randint(100000, 999999))

# Default wiring: use the table specified by the environment variable TABLE_NAME.
_default_table = boto3.resource('dynamodb').Table(os.environ.get("TABLE_NAME", "SignalingSessions"))
# Expose the table as a global for backward compatibility if needed.
table = _default_table
lambda_handler = create_handler(_default_table)