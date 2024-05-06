#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { OpenbimCdkStack } from '../lib/openbim-cdk-stack';

const app = new cdk.App();
new OpenbimCdkStack(app, 'OpenbimCdkStack');
