import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

const NAME_PREFIX = "openbim";

export class OpenbimCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * Website
     */
    const websiteBucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName: `${NAME_PREFIX}-website`,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    new s3deploy.BucketDeployment(this, "WebsiteDeployment", {
      sources: [s3deploy.Source.asset("../client/dist")],
      destinationBucket: websiteBucket,
    });
    const websiteDistribution = new cloudfront.Distribution(
      this,
      "WebsiteDistribution",
      {
        comment: `${NAME_PREFIX}-website distribution`,
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
        defaultBehavior: {
          origin: new S3Origin(websiteBucket),
        },
      }
    );

    /**
     * API
     */
    const fn = new NodejsFunction(this, "lambda", {
      functionName: `${NAME_PREFIX}-hono`,
      projectRoot: "../server",
      entry: "../server/src/index.ts",
      depsLockFilePath: "../server/package-lock.json",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        CLIENT_URL: `https://${websiteDistribution.domainName}`,
      },
    });

    fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    const api = new apigw.LambdaRestApi(this, `${NAME_PREFIX}-api`, {
      handler: fn,
    });

    /**
     * Model Bucket
     * Storage for uploaded model files
     */
    const modelBucket = new s3.Bucket(this, "ModelBucket", {
      autoDeleteObjects: true,
      bucketName: `${NAME_PREFIX}-models`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
          ],
          allowedOrigins: [websiteBucket.bucketDomainName],
          exposedHeaders: ["Location", "ETag"],
        },
      ],
    });
    modelBucket.grantReadWrite(fn);
    const modelDistribution = new cloudfront.Distribution(
      this,
      "ModelDistribution",
      {
        comment: `${NAME_PREFIX}-models distribution`,
        defaultBehavior: {
          origin: new S3Origin(modelBucket),
        },
      }
    );

    new cdk.CfnOutput(this, "WebsiteUrl", {
      value: `https://${websiteDistribution.domainName}`,
    });
    new cdk.CfnOutput(this, "ModelDistributionUrl", {
      value: `https://${modelDistribution.domainName}`,
    });
  }
}
