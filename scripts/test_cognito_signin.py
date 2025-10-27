import boto3
import os
import sys

USER_POOL_ID = 'us-east-1_krDuGPDGf'
CLIENT_ID = '1n60318b1k95pv6cs70jdg7arr'

EMAIL = 'testuser+bot@example.com'
PASSWORD = 'TestPassw0rd!'

client = boto3.client('cognito-idp')

try:
    # Create user (suppress sending invitation)
    print('Creating user...')
    client.admin_create_user(
        UserPoolId=USER_POOL_ID,
        Username=EMAIL,
        UserAttributes=[
            {'Name': 'email', 'Value': EMAIL},
            {'Name': 'email_verified', 'Value': 'true'},
        ],
        MessageAction='SUPPRESS'
    )
except client.exceptions.UsernameExistsException:
    print('User already exists; continuing...')
except Exception as e:
    print('Failed to create user:', e)

try:
    print('Setting permanent password...')
    client.admin_set_user_password(
        UserPoolId=USER_POOL_ID,
        Username=EMAIL,
        Password=PASSWORD,
        Permanent=True
    )
except Exception as e:
    print('Failed to set password:', e)

try:
    print('Attempting sign-in (USER_PASSWORD_AUTH)...')
    resp = client.initiate_auth(
        ClientId=CLIENT_ID,
        AuthFlow='USER_PASSWORD_AUTH',
        AuthParameters={
            'USERNAME': EMAIL,
            'PASSWORD': PASSWORD,
        }
    )
    print('Sign-in successful. Response:')
    print(resp)
except client.exceptions.NotAuthorizedException as e:
    print('NotAuthorized:', e)
except client.exceptions.UserNotConfirmedException as e:
    print('UserNotConfirmed:', e)
except Exception as e:
    print('Sign-in failed:', e)

# Cleanup: delete user to avoid clutter
try:
    print('Deleting test user...')
    client.admin_delete_user(UserPoolId=USER_POOL_ID, Username=EMAIL)
    print('Deleted test user')
except Exception as e:
    print('Cleanup failed:', e)

print('Done')
