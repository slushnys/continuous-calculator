import type { AWS } from '@serverless/typescript'

const serverlessConfig: AWS = {
    service: 'calculation-service',
    provider: {
        name: 'aws',
        region: 'eu-west-1',
        runtime: 'nodejs16.x',
        environment: {
            NODE_OPTIONS: '--enable-source-maps',
        },
    },
    package: {
        excludeDevDependencies: true,
        individually: true,
    },
    plugins: ['serverless-esbuild'],
    custom: {
        esbuild: {
            bundle: true,
            sourcemap: true,
            exclude: ['aws-sdk'],
            platform: 'node',
            minify: false,
            target: 'node16',
        },
    },
    functions: {
        calculate: {
            handler: 'src/functions/calculate/index.handler',
            environment: {
                QUEUE_URL: 'https://sqs.eu-west-1.amazonaws.com/348680313903/CALCULATION_QUEUE',
            },
            events: [
                {
                    http: {
                        method: 'POST',
                        path: '/calculate',
                    },
                },
            ],
        },
        'process-calculation': {
            handler: 'src/functions/process-calculation/index.handler',
            environment: {
                S3_BUCKET: 'calculation-results-storage',
            },
            events: [
                {
                    sqs: {
                        batchSize: 1,
                        enabled: true,
                        arn: 'arn:aws:sqs:eu-west-1:348680313903:CALCULATION_QUEUE',
                    },
                },
            ],
        },
        'get-calculation': {
            handler: 'src/functions/get-calculation/index.handler',
            environment: {
                S3_BUCKET: 'calculation-results-storage',
            },
            events: [
                {
                    http: {
                        method: 'GET',
                        path: '/calculation',
                        request: {
                            parameters: {
                                querystrings: {
                                    userId: true,
                                },
                            },
                        },
                    },
                },
            ],
        },
    },
}

module.exports = serverlessConfig
