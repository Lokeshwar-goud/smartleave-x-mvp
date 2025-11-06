import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class SmartleaveXMvpStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============ DynamoDB Tables ============
    
    const leaveTable = new dynamodb.Table(this, 'LeaveRequests', {
      partitionKey: { name: 'leave_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    const leaveBalanceTable = new dynamodb.Table(this, 'LeaveBalance', {
      partitionKey: { name: 'employee_email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============ Cognito User Pool ============
    
    const userPool = new cognito.UserPool(this, 'SmartLeaveUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        fullname: {
          required: true,
          mutable: true,
        },
      },
      autoVerify: {
        email: true,
      },
    });
    
    const userPoolClient = userPool.addClient('SmartLeaveClient', {
      userPoolClientName: 'smartleave-web-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        adminUserPassword: true,
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(7),
    });

    // ============ Lambda Execution Role ============

    const lambdaRole = new cdk.aws_iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant Lambda permissions to DynamoDB tables
    leaveTable.grantReadWriteData(lambdaRole);
    leaveBalanceTable.grantReadWriteData(lambdaRole);

    // Grant Lambda permissions to send emails via SES
    lambdaRole.addToPrincipalPolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: [
          'ses:SendEmail',
          'ses:SendRawEmail',
          'ses:SendTemplatedEmail'
        ],
        resources: ['*'],
      })
    );

    // ============ Lambda Functions ============

    const createLeaveLambda = new cdk.aws_lambda.Function(this, 'CreateLeaveFunction', {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
      handler: 'create-leave.handler',
      code: cdk.aws_lambda.Code.fromAsset('lambdas'),
      role: lambdaRole,
      environment: {
        LEAVE_TABLE_NAME: leaveTable.tableName,
        LEAVE_BALANCE_TABLE_NAME: leaveBalanceTable.tableName,
        SENDER_EMAIL: 'dlokeshwargoud@gmail.com',
      },
      timeout: cdk.Duration.seconds(30),
    });

    const getLeavesLambda = new cdk.aws_lambda.Function(this, 'GetLeavesFunction', {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
      handler: 'get-leaves.handler',
      code: cdk.aws_lambda.Code.fromAsset('lambdas'),
      role: lambdaRole,
      environment: {
        LEAVE_TABLE_NAME: leaveTable.tableName,
        LEAVE_BALANCE_TABLE_NAME: leaveBalanceTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    const approveRejectLambda = new cdk.aws_lambda.Function(this, 'ApproveRejectFunction', {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
      handler: 'approve-reject.handler',
      code: cdk.aws_lambda.Code.fromAsset('lambdas'),
      role: lambdaRole,
      environment: {
        LEAVE_TABLE_NAME: leaveTable.tableName,
        LEAVE_BALANCE_TABLE_NAME: leaveBalanceTable.tableName,
        SENDER_EMAIL: 'dlokeshwargoud@gmail.com',
      },
      timeout: cdk.Duration.seconds(30),
    });

    const getBalanceLambda = new cdk.aws_lambda.Function(this, 'GetBalanceFunction', {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
      handler: 'get-balance.handler',
      code: cdk.aws_lambda.Code.fromAsset('lambdas'),
      role: lambdaRole,
      environment: {
        LEAVE_BALANCE_TABLE_NAME: leaveBalanceTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    const getAllLeavesLambda = new cdk.aws_lambda.Function(this, 'GetAllLeavesFunction', {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_11,
      handler: 'get-all-leaves.handler',
      code: cdk.aws_lambda.Code.fromAsset('lambdas'),
      role: lambdaRole,
      environment: {
        LEAVE_TABLE_NAME: leaveTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // ============ Lambda Function URLs ============

    const createLeaveUrl = createLeaveLambda.addFunctionUrl({
      cors: {
        allowedMethods: [cdk.aws_lambda.HttpMethod.POST],
        allowedOrigins: ['http://localhost:3000'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
    });

    const getLeavesUrl = getLeavesLambda.addFunctionUrl({
      cors: {
        allowedMethods: [cdk.aws_lambda.HttpMethod.GET],
        allowedOrigins: ['*'],
      },
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
    });

    const approveRejectUrl = approveRejectLambda.addFunctionUrl({
      cors: {
        allowedMethods: [cdk.aws_lambda.HttpMethod.GET, cdk.aws_lambda.HttpMethod.POST],
        allowedOrigins: ['*'],
      },
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
    });

    const getBalanceUrl = getBalanceLambda.addFunctionUrl({
      cors: {
        allowedMethods: [cdk.aws_lambda.HttpMethod.GET],
        allowedOrigins: ['*'],
      },
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
    });

    const getAllLeavesUrl = getAllLeavesLambda.addFunctionUrl({
      cors: {
        allowedMethods: [cdk.aws_lambda.HttpMethod.GET],
        allowedOrigins: ['*'],
      },
      authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
    });

    // ============ Outputs ============
    
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: 'UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      exportName: 'UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'LeaveTableName', {
      value: leaveTable.tableName,
      exportName: 'LeaveTableName',
    });

    new cdk.CfnOutput(this, 'LeaveBalanceTableName', {
      value: leaveBalanceTable.tableName,
      exportName: 'LeaveBalanceTableName',
    });

    new cdk.CfnOutput(this, 'CreateLeaveFunctionUrl', {
      value: createLeaveUrl.url,
      exportName: 'CreateLeaveFunctionUrl',
    });

    new cdk.CfnOutput(this, 'GetLeavesFunctionUrl', {
      value: getLeavesUrl.url,
      exportName: 'GetLeavesFunctionUrl',
    });

    new cdk.CfnOutput(this, 'ApproveRejectFunctionUrl', {
      value: approveRejectUrl.url,
      exportName: 'ApproveRejectFunctionUrl',
    });

    new cdk.CfnOutput(this, 'GetBalanceFunctionUrl', {
      value: getBalanceUrl.url,
      exportName: 'GetBalanceFunctionUrl',
    });

    new cdk.CfnOutput(this, 'GetAllLeavesFunctionUrl', {
      value: getAllLeavesUrl.url,
      exportName: 'GetAllLeavesFunctionUrl',
    });
  }
}