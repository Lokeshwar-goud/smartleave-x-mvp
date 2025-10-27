import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

LEAVE_BALANCE_TABLE_NAME = os.environ.get('LEAVE_BALANCE_TABLE_NAME')

if not LEAVE_BALANCE_TABLE_NAME:
    logger.error("LEAVE_BALANCE_TABLE_NAME not set")

dynamodb = boto3.resource('dynamodb')
balance_table = dynamodb.Table(LEAVE_BALANCE_TABLE_NAME)

def handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        email = event.get('queryStringParameters', {}).get('email') if event.get('queryStringParameters') else None
        
        if not email:
            logger.error("Email parameter missing")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Email parameter required'})
            }
        
        logger.info(f"Fetching balance for {email}")
        
        try:
            response = balance_table.get_item(Key={'employee_email': email})
            item = response.get('Item')
            
            if item:
                balance = item.get('balance', 20)
            else:
                # Default to 20 if no record
                balance = 20
                logger.info(f"No balance record for {email}, returning default: 20")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'balance': balance})
            }
        except Exception as e:
            logger.exception(f"Error fetching balance: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
            
    except Exception as e:
        logger.exception(f"Unexpected error in get-balance: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }