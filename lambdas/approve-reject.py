import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

LEAVE_TABLE_NAME = os.environ.get('LEAVE_TABLE_NAME')
LEAVE_BALANCE_TABLE_NAME = os.environ.get('LEAVE_BALANCE_TABLE_NAME')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL')

if not LEAVE_TABLE_NAME:
    logger.error("LEAVE_TABLE_NAME not set")
if not LEAVE_BALANCE_TABLE_NAME:
    logger.error("LEAVE_BALANCE_TABLE_NAME not set")

dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses')

leave_table = dynamodb.Table(LEAVE_TABLE_NAME)
balance_table = dynamodb.Table(LEAVE_BALANCE_TABLE_NAME)

def handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Handle both POST body and query parameters
        if event.get('body'):
            body = json.loads(event.get('body', '{}'))
            leave_id = body.get('leave_id')
            action = body.get('action')
            employee_email = body.get('employee_email')
        else:
            # Handle query parameters from email link
            query_params = event.get('queryStringParameters', {})
            leave_id = query_params.get('leave_id') if query_params else None
            action = query_params.get('action') if query_params else None
            employee_email = query_params.get('employee_email') if query_params else None
        
        if not all([leave_id, action, employee_email]):
            logger.error("Missing required parameters")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing parameters'})
            }
        
        logger.info(f"Processing {action} for leave {leave_id}")
        
        new_status = 'approved' if action == 'approve' else 'rejected'
        
        # Get leave details to know days count
        leave_response = leave_table.get_item(Key={'leave_id': leave_id})
        leave_item = leave_response.get('Item')
        
        if not leave_item:
            logger.error(f"Leave {leave_id} not found")
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Leave not found'})
            }
        
        days = leave_item.get('days', 0)
        
        # Update leave status
        leave_table.update_item(
            Key={'leave_id': leave_id},
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': new_status}
        )
        
        logger.info(f"Leave {leave_id} updated to {new_status}")
        
        # If approved, deduct from balance
        if action == 'approve':
            try:
                balance_table.update_item(
                    Key={'employee_email': employee_email},
                    UpdateExpression='SET balance = balance - :days',
                    ExpressionAttributeValues={':days': days}
                )
                logger.info(f"Deducted {days} days from {employee_email}'s balance")
            except Exception as e:
                logger.exception(f"Failed to deduct balance: {str(e)}")
        
        # Send notification email
        try:
            message = f'Your leave has been {new_status}.'
            ses.send_email(
                Source=SENDER_EMAIL,
                Destination={'ToAddresses': [employee_email]},
                Message={
                    'Subject': {'Data': f'Leave {new_status.capitalize()}'},
                    'Body': {'Text': {'Data': message}}
                }
            )
            logger.info(f"Notification email sent to {employee_email}")
        except Exception as e:
            logger.exception(f"Failed to send email: {str(e)}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': f'Leave {new_status}'})
        }
        
    except Exception as e:
        logger.exception(f"Unexpected error in approve-reject: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }