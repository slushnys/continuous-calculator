import 'reflect-metadata'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

import { makeCalculationRepository } from '../../repositories/calculation'

export function makeProcessCalculation({
    s3Client,
    calculationRepository,
}: {
    s3Client: S3Client
    calculationRepository: ReturnType<typeof makeCalculationRepository>
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
