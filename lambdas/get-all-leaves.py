import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

LEAVE_TABLE_NAME = os.environ.get('LEAVE_TABLE_NAME')

if not LEAVE_TABLE_NAME:
    logger.error("LEAVE_TABLE_NAME not set")

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(LEAVE_TABLE_NAME)

def handler(event, context):
    try:
        logger.info(f"Fetching all leaves")
        
        response = table.scan()
        items = response.get('Items', [])
        
        logger.info(f"Found {len(items)} leaves")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(items, default=str)
        }
        
    except Exception as e:
        logger.exception(f"Error fetching leaves: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }