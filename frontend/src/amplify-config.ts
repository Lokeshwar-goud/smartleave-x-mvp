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

export const apiEndpoints = {
  createLeave: 'https://5qcpamlbqz4wx2iytom4ijfwie0ejjzp.lambda-url.us-east-1.on.aws/',
  getLeaves: 'https://uu4sqg74bl5fhcootcp5xs7ddq0hbjqe.lambda-url.us-east-1.on.aws/',
  getBalance: 'https://ypgampwc6k2os77vzhzfzatms40ueaag.lambda-url.us-east-1.on.aws/',
  getAllLeaves: 'https://kupmf6cwzajwp4xhcb56bydwni0cdzpm.lambda-url.us-east-1.on.aws/',
  approveReject: 'https://lj4br2cwo4uhhe66yraschnwz40aeagl.lambda-url.us-east-1.on.aws/',
};