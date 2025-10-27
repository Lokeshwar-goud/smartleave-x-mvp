import json
import boto3
import logging
import os

# Setup logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Get environment variables
LEAVE_TABLE_NAME = os.environ.get('LEAVE_TABLE_NAME')

if not LEAVE_TABLE_NAME:
    logger.error("LEAVE_TABLE_NAME not set in environment")

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(LEAVE_TABLE_NAME)

def handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Get email from query parameters
        email = event.get('queryStringParameters', {}).get('email') if event.get('queryStringParameters') else None
        
        if not email:
            logger.error("Email parameter missing")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Email parameter required'})
            }
        
        logger.info(f"Fetching leaves for {email}")
        
        # Query DynamoDB for leaves by employee email
        response = table.scan(
            FilterExpression='employee_email = :email',
            ExpressionAttributeValues={':email': email}
        )
        
        items = response.get('Items', [])
        logger.info(f"Found {len(items)} leaves for {email}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(items, default=str)
        }
        
    except Exception as e:
        logger.exception(f"Unexpected error in get-leaves: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }