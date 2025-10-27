import { Amplify } from 'aws-amplify';

export const configureAmplify = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: 'us-east-1_krDuGPDGf',
        userPoolClientId: '1n60318b1k95pv6cs70jdg7arr',
      },
    },
  });
};