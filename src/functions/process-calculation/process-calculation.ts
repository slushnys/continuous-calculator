import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'

export function makeProcessCalculation({
    s3Client,
    dynamoDbDocumentClient,
}: {
    dynamoDbDocumentClient: DynamoDBDocumentClient
    s3Client: S3Client
}) {
    return async function processCalculation({
        userId,
        firstNumber,
        secondNumber,
    }: {
        userId: string
        firstNumber: number
        secondNumber: number
    }) {
        const result = firstNumber + secondNumber
        const calculationTimestamp = new Date().getTime().toString()
        const storedAt = `${userId}/calculation-${calculationTimestamp}.json`
        await s3Client.send(
            new PutObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: storedAt,
                Body: JSON.stringify({ result }),
            })
        )
        await dynamoDbDocumentClient.send(
            new BatchWriteCommand({
                RequestItems: {
                    'dev-CalculationResultsTable': [
                        {
                            PutRequest: {
                                Item: {
                                    partitionKey: userId,
                                    sortKey: 'latest',

                                    storedAt,
                                    createdAt: new Date().toISOString(),
                                },
                            },
                        },
                        {
                            PutRequest: {
                                Item: {
                                    partitionKey: userId,
                                    sortKey: calculationTimestamp,

                                    storedAt,
                                    createdAt: new Date().toISOString(),
                                },
                            },
                        },
                    ],
                },
            })
        )
        return result
    }
}
