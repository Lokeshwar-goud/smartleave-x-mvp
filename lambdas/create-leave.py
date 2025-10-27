import json
import boto3
import uuid
import logging
import os
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

LEAVE_TABLE_NAME = os.environ.get('LEAVE_TABLE_NAME')
LEAVE_BALANCE_TABLE_NAME = os.environ.get('LEAVE_BALANCE_TABLE_NAME')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL')

if not LEAVE_TABLE_NAME:
    logger.error("LEAVE_TABLE_NAME not set")
if not SENDER_EMAIL:
    logger.warning("SENDER_EMAIL not set")

dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses')

leave_table = dynamodb.Table(LEAVE_TABLE_NAME)
balance_table = dynamodb.Table(LEAVE_BALANCE_TABLE_NAME)

def handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        body = json.loads(event.get('body', '{}'))
        
        employee_email = body.get('employee_email')
        approver_email = body.get('approver_email')
        start_date = body.get('start_date')
        end_date = body.get('end_date')
        reason = body.get('reason')
        
        if not all([employee_email, approver_email, start_date, end_date, reason]):
            logger.error("Missing required fields")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        # Calculate number of days
        from datetime import datetime as dt
        start = dt.strptime(start_date, '%Y-%m-%d')
        end = dt.strptime(end_date, '%Y-%m-%d')
        days = (end - start).days + 1
        
        logger.info(f"Leave duration: {days} days")
        
        # Check if employee has enough balance
        try:
            balance_response = balance_table.get_item(Key={'employee_email': employee_email})
            balance_item = balance_response.get('Item')
            
            if balance_item:
                available_balance = balance_item.get('balance', 0)
                logger.info(f"Employee balance: {available_balance}")
                
                if available_balance < days:
                    logger.error(f"Insufficient balance. Available: {available_balance}, Required: {days}")
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': f'Insufficient leave balance. Available: {available_balance} days, Required: {days} days'})
                    }
            else:
                logger.warning(f"No balance record for {employee_email}. Initializing with 20 days")
                # Initialize with 20 days if no record exists
                balance_table.put_item(Item={
                    'employee_email': employee_email,
                    'balance': 20
                })
                available_balance = 20
                
                if available_balance < days:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': f'Insufficient leave balance. Available: {available_balance} days, Required: {days} days'})
                    }
        except Exception as e:
            logger.exception(f"Error checking balance: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': f'Balance check failed: {str(e)}'})
            }
        
        # Create leave record
        leave_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        logger.info(f"Creating leave: {leave_id} for {employee_email}")
        
        leave_table.put_item(Item={
            'leave_id': leave_id,
            'employee_email': employee_email,
            'approver_email': approver_email,
            'start_date': start_date,
            'end_date': end_date,
            'reason': reason,
            'status': 'pending',
            'created_at': created_at,
            'days': days
        })
        
        logger.info(f"Leave saved to DynamoDB: {leave_id}")
        
        # Send confirmation email to employee
        try:
            ses.send_email(
                Source=SENDER_EMAIL,
                Destination={'ToAddresses': [employee_email]},
                Message={
                    'Subject': {'Data': 'Leave Application Received'},
                    'Body': {'Text': {'Data': f'Your leave request from {start_date} to {end_date} ({days} days) has been received.\n\nReason: {reason}\n\nYour request is pending approval.'}}
                }
            )
            logger.info(f"Confirmation email sent to {employee_email}")
        except Exception as e:
            logger.exception(f"Failed to send confirmation email: {str(e)}")
        
        # Send notification email to approver with approval links
        try:
            approve_link = f"https://lj4br2cwo4uhhe66yraschnwz40aeagl.lambda-url.us-east-1.on.aws/"
            reject_link = f"https://lj4br2cwo4uhhe66yraschnwz40aeagl.lambda-url.us-east-1.on.aws/"
    
            email_body = f"""
        Dear Approver,

        Employee {employee_email} has applied for leave.

        Leave Details:
        - Start Date: {start_date}
        - End Date: {end_date}
        - Duration: {days} days
        - Reason: {reason}

        Please review and take action:

        APPROVE: {approve_link}

        REJECT: {reject_link}

        Regards,
        SmartLeaveX System
        """
    
            ses.send_email(
                Source=SENDER_EMAIL,
                Destination={'ToAddresses': [approver_email]},
                Message={
                    'Subject': {'Data': f'New Leave Request to Approve - {employee_email}'},
                    'Body': {'Text': {'Data': email_body}}
                }
            )
            logger.info(f"Notification email with approval links sent to {approver_email}")
        except Exception as e:
            logger.exception(f"Failed to send notification email: {str(e)}")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Leave applied successfully',
                'leave_id': leave_id,
                'days': days
            })
        }
        
    except Exception as e:
        logger.exception(f"Unexpected error in create-leave: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }