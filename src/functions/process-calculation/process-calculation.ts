import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

import { makeCalculationRepository } from '../../repositories/calculation'

const calculationRepository = makeCalculationRepository()

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
        await calculationRepository.addCalculation(userId, storedAt)
        return result
    }
}
