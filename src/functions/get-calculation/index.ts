import type { APIGatewayProxyHandler } from 'aws-lambda'
import { isDefined } from 'src/common/utils'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'

const s3Client = new S3Client({ region: 'eu-west-1' })

const dynamoDbClient = new DynamoDBClient({ region: 'eu-west-1' })
const dynamoDbDocumentClient = DynamoDBDocumentClient.from(dynamoDbClient)

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    const userId = event.queryStringParameters?.userId
    if (!isDefined(userId)) {
        return await Promise.resolve({
            body: 'no user found',
            statusCode: 401,
        })
    }

    const resultsRecord = await dynamoDbDocumentClient.send(
        new GetCommand({
            TableName: 'dev-CalculationResultsTable',
            Key: {
                partitionKey: userId,
                sortKey: 'latest',
            },
        })
    )
    const { Body } = await s3Client.send(
        new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: resultsRecord?.Item?.storedAt,
        })
    )
    let result

    const streamToString = async (stream) =>
        await new Promise((resolve, reject) => {
            const chunks = []
            stream.on('data', (chunk) => chunks.push(chunk))
            stream.on('error', reject)
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        })

    result = await streamToString(Body)
    // if (Body instanceof Blob) {
    //     result = await Body.text()
    // } else if (Body instanceof ReadableStream) {
    //     result = (await Body.getReader().read()).value
    // } else {
    //     result = Body?.setEncoding('utf-8').read()
    // }

    // console.log('results are: ', Body)
    return await Promise.resolve({
        body: JSON.stringify({ calculation: result }),
        statusCode: 200,
    })
}
