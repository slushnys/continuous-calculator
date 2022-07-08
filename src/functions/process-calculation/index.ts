import { S3Client } from '@aws-sdk/client-s3'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import type { SQSHandler } from 'aws-lambda'
import { isDefined } from 'src/common/utils'
import { makeProcessCalculation } from './process-calculation'

const s3Client = new S3Client({ region: 'eu-west-1' })
const dynamoDbClient = new DynamoDBClient({ region: 'eu-west-1' })
const dynamoDbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient)

export const handler: SQSHandler = async (event, context) => {
    const { Records: records } = event
    if (!isDefined(records)) {
        throw Error('no records found')
    }
    const processCalculation = makeProcessCalculation({ s3Client, dynamoDbDocumentClient })

    for (const record of records) {
        const { userId, firstNumber, secondNumber } = JSON.parse(record.body)
        if (!isDefined(userId)) {
            throw Error('No user has been provided')
        }

        if (typeof firstNumber !== 'string' || typeof secondNumber !== 'string') {
            throw Error('both numbers have to be strings')
        }

        const [first, second] = [Number(firstNumber), Number(secondNumber)]
        try {
            await processCalculation({ userId, firstNumber: first, secondNumber: second })
        } catch (error) {
            console.log('error when processing calculation')
            throw error
        }
    }
}
