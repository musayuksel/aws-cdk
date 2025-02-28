#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { PromoApiCdkStack } from './promo-api-cdk-stack'

const app = new cdk.App()
// eslint-disable-next-line no-new
new PromoApiCdkStack(app, 'promoApiCdkStack', {})
